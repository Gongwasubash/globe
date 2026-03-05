import { useState, useEffect, useCallback } from 'react'

interface Vessel {
  mmsi: number
  name: string
  lat: number
  lon: number
  course: number
  speed: number
  heading: number
  type: string
  flag: string
  timestamp: number
}

interface VesselData {
  vessels: Vessel[]
  count: number
  timestamp: number
}

interface UseVesselsOptions {
  bounds?: [number, number, number, number]
  vesselType?: string
  refreshInterval?: number
  enabled?: boolean
}

export function useVessels(options: UseVesselsOptions = {}) {
  const {
    bounds,
    vesselType,
    refreshInterval = 30000,
    enabled = true
  } = options

  const [data, setData] = useState<VesselData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVessels = useCallback(async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      if (!bounds) {
        setData({ vessels: [], count: 0, timestamp: Date.now() })
        return
      }

      const [minLat, minLon, maxLat, maxLon] = bounds
      const url = `https://www.vesselfinder.com/api/pub/click/${minLat}/${minLon}/${maxLat}/${maxLon}/2/0`
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000)
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const apiData = await response.json()
      
      const vessels: Vessel[] = (apiData.vessels || []).map((v: any) => ({
        mmsi: v.mmsi || 0,
        name: v.name || 'Unknown',
        lat: v.lat || 0,
        lon: v.lon || 0,
        course: v.course || 0,
        speed: v.speed || 0,
        heading: v.heading || 0,
        type: v.type || 'Unknown',
        flag: v.flag || 'Unknown',
        timestamp: Date.now()
      }))

      setData({ vessels, count: vessels.length, timestamp: Date.now() })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vessels')
      console.error('Vessels fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [bounds, enabled])

  useEffect(() => {
    fetchVessels()
  }, [fetchVessels])

  useEffect(() => {
    if (!enabled || !refreshInterval) return
    const interval = setInterval(fetchVessels, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchVessels, refreshInterval, enabled])

  const getVesselsByType = useCallback((type: string) => {
    return data?.vessels.filter(vessel => 
      vessel.type.toLowerCase().includes(type.toLowerCase())
    ) || []
  }, [data])

  const getVesselsInArea = useCallback((bounds: [number, number, number, number]) => {
    const [minLat, minLon, maxLat, maxLon] = bounds
    return data?.vessels.filter(vessel => 
      vessel.lat >= minLat && vessel.lat <= maxLat &&
      vessel.lon >= minLon && vessel.lon <= maxLon
    ) || []
  }, [data])

  const vesselTypes = {
    cargo: getVesselsByType('cargo'),
    tanker: getVesselsByType('tanker'),
    passenger: getVesselsByType('passenger'),
    fishing: getVesselsByType('fishing'),
    military: getVesselsByType('military'),
    yacht: getVesselsByType('yacht'),
    tug: getVesselsByType('tug')
  }

  return {
    vessels: data?.vessels || [],
    vesselTypes,
    count: data?.count || 0,
    timestamp: data?.timestamp,
    loading,
    error,
    refetch: fetchVessels,
    getVesselsByType,
    getVesselsInArea
  }
}
