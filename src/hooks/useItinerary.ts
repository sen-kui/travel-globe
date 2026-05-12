import { useState, useCallback } from 'react'
import type { Destination, Itinerary, ItineraryParams } from '../types'

export type ItineraryStatus = 'idle' | 'generating' | 'done' | 'error'

export function useItinerary() {
  const [status, setStatus] = useState<ItineraryStatus>('idle')
  const [rawText, setRawText] = useState('')
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (destination: Destination, params: ItineraryParams) => {
    setStatus('generating')
    setRawText('')
    setItinerary(null)
    setError(null)

    try {
      const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, params }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(errText || `HTTP ${response.status}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const content: string = parsed.content ?? ''
            accumulated += content
            setRawText(accumulated)
          } catch {
            // ignore parse errors for partial chunks
          }
        }
      }

      // 提取 JSON：推理模型先输出思考过程，JSON 在最后
      // 策略1：找 ```json ... ``` 代码块（推理模型常用此格式）
      // 策略2：遍历字符找最后一个完整的 { } 对象（最鲁棒）
      let jsonStr: string | null = null

      // 1. 找 ```json 代码块
      const codeBlock = accumulated.match(/```json\s*([\s\S]*?)```/)
      if (codeBlock) {
        jsonStr = codeBlock[1].trim()
      }

      // 2. 遍历找最后一个完整 JSON 对象（对没有 ``` 包裹的情况）
      if (!jsonStr) {
        const candidates: string[] = []
        let depth = 0
        let start = -1
        for (let i = 0; i < accumulated.length; i++) {
          if (accumulated[i] === '{') {
            if (depth === 0) start = i
            depth++
          } else if (accumulated[i] === '}') {
            depth--
            if (depth === 0 && start >= 0) {
              candidates.push(accumulated.slice(start, i + 1))
            }
          }
        }
        // 取最后一个（推理在前，答案在后）
        jsonStr = candidates[candidates.length - 1] ?? null
      }

      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr) as Itinerary
          setItinerary(parsed)
          setStatus('done')
        } catch {
          setError('行程数据解析失败，可能内容太长被截断，请减少天数后重试')
          setStatus('error')
        }
      } else {
        setError('未收到有效的行程数据，请重试')
        setStatus('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败，请重试')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setRawText('')
    setItinerary(null)
    setError(null)
  }, [])

  return { status, rawText, itinerary, error, generate, reset }
}
