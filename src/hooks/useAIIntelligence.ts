import { useState, useCallback, useRef } from 'react'
import { Cartesian3, Rectangle } from 'cesium'

export interface IntelligenceData {
  flights: any[]
  satellites: any[]
  earthquakes: any[]
  wildfires: any[]
}

export interface ThreatAssessment {
  level: 'low' | 'medium' | 'high' | 'critical'
  score: number
  factors: string[]
  summary: string
}

export interface RegionIntelligence {
  region: string
  timestamp: Date
  threatLevel: ThreatAssessment
  activities: {
    flights: number
    satellites: number
    earthquakes: number
    wildfires: number
  }
  alerts: string[]
  summary: string
}

export function useAIIntelligence(viewer: any, data: IntelligenceData) {
  const [intelligence, setIntelligence] = useState<RegionIntelligence | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const analysisCache = useRef<Map<string, RegionIntelligence>>(new Map())

  const calculateThreatLevel = useCallback((activities: any): ThreatAssessment => {
    let score = 0
    const factors: string[] = []

    // Military aircraft detection
    const militaryFlights = activities.flights.filter((f: any) => 
      f.callsign?.includes('ARMY') || f.callsign?.includes('NAVY') || 
      f.callsign?.includes('AIR') || f.altitude > 40000
    )
    if (militaryFlights.length > 0) {
      score += militaryFlights.length * 15
      factors.push(`${militaryFlights.length} military aircraft detected`)
    }

    // High earthquake activity
    const recentQuakes = activities.earthquakes.filter((e: any) => e.magnitude > 4.0)
    if (recentQuakes.length > 0) {
      score += recentQuakes.length * 10
      factors.push(`${recentQuakes.length} significant earthquakes`)
    }

    // Active wildfires
    if (activities.wildfires.length > 5) {
      score += activities.wildfires.length * 5
      factors.push(`${activities.wildfires.length} active fire hotspots`)
    }

    // Satellite surveillance
    const surveillanceSats = activities.satellites.filter((s: any) => 
      s.name?.includes('SPY') || s.name?.includes('RECON')
    )
    if (surveillanceSats.length > 0) {
      score += surveillanceSats.length * 8
      factors.push(`${surveillanceSats.length} surveillance satellites overhead`)
    }

    let level: 'low' | 'medium' | 'high' | 'critical'
    if (score < 20) level = 'low'
    else if (score < 50) level = 'medium'
    else if (score < 80) level = 'high'
    else level = 'critical'

    return { level, score, factors, summary: `Threat score: ${score}` }
  }, [])

  const analyzeRegion = useCallback(async (bounds?: Rectangle) => {
    if (!viewer || !data) return

    setIsAnalyzing(true)

    try {
      // Get current camera view if no bounds specified
      const camera = viewer.camera
      const viewBounds = bounds || camera.computeViewRectangle()
      
      if (!viewBounds) {
        setIsAnalyzing(false)
        return
      }

      const regionKey = `${viewBounds.west}_${viewBounds.south}_${viewBounds.east}_${viewBounds.north}`
      
      // Check cache first
      if (analysisCache.current.has(regionKey)) {
        setIntelligence(analysisCache.current.get(regionKey)!)
        setIsAnalyzing(false)
        return
      }

      // Filter data within view bounds
      const activitiesInView = {
        flights: data.flights.filter(f => 
          f.longitude >= viewBounds.west && f.longitude <= viewBounds.east &&
          f.latitude >= viewBounds.south && f.latitude <= viewBounds.north
        ),
        satellites: data.satellites.filter(s => 
          s.longitude >= viewBounds.west && s.longitude <= viewBounds.east &&
          s.latitude >= viewBounds.south && s.latitude <= viewBounds.north
        ),
        earthquakes: data.earthquakes.filter(e => 
          e.longitude >= viewBounds.west && e.longitude <= viewBounds.east &&
          e.latitude >= viewBounds.south && e.latitude <= viewBounds.north
        ),
        wildfires: data.wildfires.filter(w => 
          w.longitude >= viewBounds.west && w.longitude <= viewBounds.east &&
          w.latitude >= viewBounds.south && w.latitude <= viewBounds.north
        )
      }

      const threatLevel = calculateThreatLevel(activitiesInView)
      
      const alerts: string[] = []
      if (activitiesInView.flights.length > 10) alerts.push('High air traffic density')
      if (activitiesInView.earthquakes.some((e: any) => e.magnitude > 5.0)) alerts.push('Major seismic activity')
      if (activitiesInView.wildfires.length > 10) alerts.push('Multiple active fires')

      const regionIntel: RegionIntelligence = {
        region: 'Current View',
        timestamp: new Date(),
        threatLevel,
        activities: {
          flights: activitiesInView.flights.length,
          satellites: activitiesInView.satellites.length,
          earthquakes: activitiesInView.earthquakes.length,
          wildfires: activitiesInView.wildfires.length
        },
        alerts,
        summary: `Analyzed ${activitiesInView.flights.length + activitiesInView.satellites.length + activitiesInView.earthquakes.length + activitiesInView.wildfires.length} entities in region`
      }

      // Cache the result
      analysisCache.current.set(regionKey, regionIntel)
      setIntelligence(regionIntel)

    } catch (error) {
      console.error('AI analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [viewer, data, calculateThreatLevel])

  const getEntityIntelligence = useCallback((entity: any) => {
    if (!entity) return null

    const entityType = entity.name?.toLowerCase() || ''
    let threat = 'low'
    let notes: string[] = []

    // Flight analysis
    if (entity.billboard && entityType.includes('flight')) {
      if (entity.altitude > 40000) {
        threat = 'medium'
        notes.push('High altitude flight')
      }
      if (entityType.includes('military') || entityType.includes('army')) {
        threat = 'high'
        notes.push('Military aircraft')
      }
    }

    // Satellite analysis
    if (entityType.includes('satellite')) {
      if (entityType.includes('spy') || entityType.includes('recon')) {
        threat = 'high'
        notes.push('Surveillance satellite')
      }
    }

    // Earthquake analysis
    if (entityType.includes('earthquake')) {
      const magnitude = entity.magnitude || 0
      if (magnitude > 5.0) {
        threat = 'high'
        notes.push(`Magnitude ${magnitude} earthquake`)
      }
    }

    return {
      threat,
      notes,
      lastUpdated: new Date()
    }
  }, [])

  return {
    intelligence,
    isAnalyzing,
    analyzeRegion,
    getEntityIntelligence
  }
}