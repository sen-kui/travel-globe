import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ── 读取 .env.local ─────────────────────────────────────────────────────────
function loadLocalEnv(): Record<string, string> {
  try {
    return Object.fromEntries(
      fs.readFileSync('.env.local', 'utf-8')
        .split('\n')
        .map((l) => l.match(/^([^#=][^=]*)=(.*)$/))
        .filter(Boolean)
        .map((m) => [m![1].trim(), m![2].trim()]),
    )
  } catch {
    return {}
  }
}

const localEnv = loadLocalEnv()

// ── Prompt 构建 ─────────────────────────────────────────────────────────────
function buildPrompt(dest: Record<string, unknown>, params: Record<string, unknown>): string {
  const top3 = (dest.top3 as string[]).join('、')
  const visa = (dest.visa as string[]).join('、')
  const bestSeason = (dest.bestSeason as string[]).join('、')
  return `你是一位专业旅行规划师。请为以下旅行生成详细的每日行程规划。

目的地：${dest.nameCN}（${dest.nameEN}）
地区：${dest.region}
标志性景点：${top3}
目的地特色：${dest.desc}
行程天数：${params.days}天
旅行风格：${params.style}
预算档位：${params.budget}
货币：${dest.currency}
时区：${dest.timezone}
签证情况：${visa}
最佳季节：${bestSeason}

请以 JSON 格式返回，结构如下（仅返回 JSON，不要有其他文字）：
{
  "title": "行程标题（带创意感）",
  "summary": "一段行程总体描述（2-3句话，突出旅行亮点）",
  "days": [
    {
      "day": 1,
      "theme": "当天主题（简短）",
      "activities": [
        {
          "time": "上午 9:00",
          "name": "活动名称",
          "category": "景点",
          "desc": "简短描述（1-2句话）",
          "tips": "实用小贴士（票价/时间/注意事项）",
          "mapQuery": "适合在地图搜索的关键词"
        }
      ]
    }
  ],
  "budgetTips": "基于${params.budget}档位的实用预算建议（3-4条要点）",
  "bestTime": "最佳游览时间提示（结合季节和当地气候）"
}

要求：每天安排 3-4 个活动，合理分配上午/下午/晚上时段，内容完全使用中文。`
}

// ── Vite 配置 ────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-dev-middleware',
      configureServer(server) {
        server.middlewares.use(
          '/api/itinerary',
          async (req: IncomingMessage, res: ServerResponse) => {
            if (req.method === 'OPTIONS') {
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
              res.statusCode = 204
              res.end()
              return
            }

            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end('Method not allowed')
              return
            }

            // 读取请求体
            const rawBody = await new Promise<string>((resolve, reject) => {
              let data = ''
              req.on('data', (chunk: Buffer) => { data += chunk.toString() })
              req.on('end', () => resolve(data))
              req.on('error', reject)
            })

            let destination: Record<string, unknown>
            let params: Record<string, unknown>
            try {
              ;({ destination, params } = JSON.parse(rawBody))
            } catch {
              res.statusCode = 400
              res.end('Invalid JSON')
              return
            }

            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')

            try {
              const { default: OpenAI } = await import('openai')
              const client = new OpenAI({
                apiKey: localEnv.QWEN_API_KEY || '',
                baseURL: localEnv.QWEN_BASE_URL || 'https://maas.devops.xiaohongshu.com/v1',
                defaultHeaders: {
                  'x-maas-user-email': localEnv.MAAS_USER_EMAIL || '',
                  'x-maas-app-id': localEnv.MAAS_APP_ID || 'qs-api',
                },
              })
              const model = localEnv.QWEN_MODEL || 'qwen-plus'
              const prompt = buildPrompt(destination, params)

              const completion = await client.chat.completions.create({
                model,
                messages: [
                  {
                    role: 'system',
                    content:
                      '你是一位专业旅行规划师，请严格按照用户要求的 JSON 格式输出，不要输出任何额外文字。',
                  },
                  { role: 'user', content: prompt },
                ],
                stream: false,
                max_tokens: 8192,
                temperature: 0.9,
              })

              const message = completion.choices[0]?.message as {
                content?: string | null
                reasoning_content?: string | null
              }
              const fullText = message?.content || message?.reasoning_content || ''

              // 提取 JSON：先找 ```json 代码块，再找最后一个完整 {}
              let jsonStr: string | null = null
              const codeBlock = fullText.match(/```json\s*([\s\S]*?)```/)
              if (codeBlock) {
                jsonStr = codeBlock[1].trim()
              } else {
                const candidates: string[] = []
                let depth = 0
                let start = -1
                for (let i = 0; i < fullText.length; i++) {
                  if (fullText[i] === '{') {
                    if (depth === 0) start = i
                    depth++
                  } else if (fullText[i] === '}') {
                    depth--
                    if (depth === 0 && start >= 0) candidates.push(fullText.slice(start, i + 1))
                  }
                }
                jsonStr = candidates[candidates.length - 1] ?? null
              }

              if (!jsonStr) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: '未能从模型输出中提取行程数据' }))
                return
              }

              const itinerary = JSON.parse(jsonStr)
              res.statusCode = 200
              res.end(JSON.stringify({ itinerary }))
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Server error'
              console.error('[API] itinerary error:', message)
              res.statusCode = 500
              res.end(JSON.stringify({ error: message }))
            }
          },
        )
      },
    },
  ],
})
