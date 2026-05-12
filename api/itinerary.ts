import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import type { Destination, ItineraryParams } from '../src/types/index.js'

const client = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: process.env.QWEN_BASE_URL || 'https://maas.devops.xiaohongshu.com/v1',
  defaultHeaders: {
    'x-maas-user-email': process.env.MAAS_USER_EMAIL || '',
    'x-maas-app-id': process.env.MAAS_APP_ID || 'qs-api',
  },
})

const MODEL = process.env.QWEN_MODEL || 'qwen-plus'

function buildPrompt(dest: Destination, params: ItineraryParams): string {
  return `你是一位专业旅行规划师。请为以下旅行生成详细的每日行程规划。

目的地：${dest.nameCN}（${dest.nameEN}）
地区：${dest.region}
标志性景点：${dest.top3.join('、')}
目的地特色：${dest.desc}
行程天数：${params.days}天
旅行风格：${params.style}
预算档位：${params.budget}
货币：${dest.currency}
时区：${dest.timezone}

签证情况：${dest.visa.join('、')}
最佳季节：${dest.bestSeason.join('、')}

请以 JSON 格式返回，结构如下（仅返回 JSON，不要有其他文字）：
{
  "title": "行程标题（带创意感，例如：「${dest.nameCN}${params.days}日深度游」）",
  "summary": "一段行程总体描述（2-3句话，突出旅行亮点）",
  "days": [
    {
      "day": 1,
      "theme": "当天主题（简短，如：「古城探秘」）",
      "activities": [
        {
          "time": "上午 9:00",
          "name": "活动名称",
          "category": "景点",
          "desc": "简短描述（1-2句话）",
          "tips": "实用小贴士（如票价、最佳拍照位置、注意事项等）",
          "mapQuery": "适合在地图搜索的关键词（英文+中文）"
        }
      ]
    }
  ],
  "budgetTips": "基于${params.budget}档位的实用预算建议（3-4条要点）",
  "bestTime": "最佳游览时间提示（结合季节和当地气候）"
}

要求：
- 每天安排 3-4 个活动，合理分配上午/下午/晚上时段
- 活动包含景点、美食、交通、购物等多种类型
- tips 要具体实用（价格/时间/注意事项）
- 行程紧凑但不过于赶，符合实际节奏
- 内容完全使用中文`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { destination, params } = req.body as {
    destination: Destination
    params: ItineraryParams
  }

  if (!destination || !params) {
    res.status(400).json({ error: 'Missing destination or params' })
    return
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const prompt = buildPrompt(destination, params)

    const stream = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一位专业旅行规划师，擅长为中国游客制定海外旅行方案。请严格按照用户要求的 JSON 格式输出，不要输出任何额外文字。',
        },
        { role: 'user', content: prompt },
      ],
      stream: true,
      max_tokens: 8192,
      temperature: 0.9,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta as {
        content?: string | null
        reasoning_content?: string | null
      }
      // kimi-k2.6 等推理模型把输出放在 reasoning_content，普通模型放 content
      const text = delta?.content || delta?.reasoning_content || ''
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
    res.end()
  }
}
