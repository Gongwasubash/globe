import { useState, useEffect } from 'react'
import { fetchAviationStackData, AviationData } from '../utils/aviationStackService'

export function useAviationStack() {
  const [data, setData] = useState<AviationData>({
    flights: [],
    routes: [],
    airports: [],
    airlines: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_AVIATIONSTACK_KEY
    if (!apiKey) {
      setError('AviationStack API key not configured')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetchAviationStackData(apiKey)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch aviation data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return { data, loading, error }
}
