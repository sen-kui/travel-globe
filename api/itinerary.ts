import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import type { Destination, ItineraryParams } from '../src/types/index'

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

function extractJson(text: string): string | null {
  // 1. 找 ```json 代码块（推理模型常用）
  const codeBlock = text.match(/```json\s*([\s\S]*?)```/)
  if (codeBlock) return codeBlock[1].trim()

  // 2. 遍历找最后一个完整 JSON 对象
  const candidates: string[] = []
  let depth = 0
  let start = -1
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i
      depth++
    } else if (text[i] === '}') {
      depth--
      if (depth === 0 && start >= 0) candidates.push(text.slice(start, i + 1))
    }
  }
  return candidates[candidates.length - 1] ?? null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

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

  try {
    const prompt = buildPrompt(destination, params)

    // 非流式调用——等待模型完整输出后一次性返回
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一位专业旅行规划师，请严格按照用户要求的 JSON 格式输出，不要输出任何额外文字。',
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

    // kimi-k2.6 输出在 reasoning_content，普通模型在 content
    const fullText = message?.content || message?.reasoning_content || ''

    const jsonStr = extractJson(fullText)
    if (!jsonStr) {
      res.status(500).json({ error: '未能从模型输出中提取行程数据' })
      return
    }

    const itinerary = JSON.parse(jsonStr)
    res.status(200).json({ itinerary })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('[itinerary]', message)
    res.status(500).json({ error: message })
  }
}
