import { useState, useCallback } from 'react'
import type { Destination, Itinerary, ItineraryParams } from '../types'

export type ItineraryStatus = 'idle' | 'generating' | 'done' | 'error'

export function useItinerary() {
  const [status, setStatus] = useState<ItineraryStatus>('idle')
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (destination: Destination, params: ItineraryParams) => {
    setStatus('generating')
    setItinerary(null)
    setError(null)

    try {
      const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, params }),
      })

      const json = await response.json() as { itinerary?: Itinerary; error?: string }

      if (!response.ok || json.error) {
        throw new Error(json.error || `HTTP ${response.status}`)
      }

      if (!json.itinerary) {
        throw new Error('未收到有效的行程数据，请重试')
      }

      setItinerary(json.itinerary)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败，请重试')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setItinerary(null)
    setError(null)
  }, [])

  return { status, itinerary, error, generate, reset }
}
