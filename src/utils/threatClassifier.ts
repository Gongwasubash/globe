export interface ThreatClassification {
  level: 'low' | 'medium' | 'high' | 'critical'
  category: 'military' | 'natural' | 'surveillance' | 'civilian' | 'unknown'
  confidence: number
  indicators: string[]
}

export class ThreatClassifier {
  static classifyFlight(flight: any): ThreatClassification {
    const indicators: string[] = []
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let category: 'military' | 'natural' | 'surveillance' | 'civilian' | 'unknown' = 'civilian'
    let confidence = 0.7

    const callsign = flight.callsign?.toUpperCase() || ''
    const altitude = flight.altitude || 0

    // Military indicators
    if (callsign.includes('ARMY') || callsign.includes('NAVY') || 
        callsign.includes('AIR') || callsign.includes('MIL')) {
      category = 'military'
      level = 'high'
      confidence = 0.9
      indicators.push('Military callsign detected')
    }

    // High altitude (possible surveillance)
    if (altitude > 40000) {
      if (category === 'civilian') category = 'surveillance'
      level = level === 'low' ? 'medium' : level
      indicators.push(`High altitude: ${altitude}ft`)
    }

    // Unusual flight patterns
    if (flight.speed && flight.speed > 600) {
      level = level === 'low' ? 'medium' : 'high'
      indicators.push(`High speed: ${flight.speed}kts`)
    }

    return { level, category, confidence, indicators }
  }

  static classifySatellite(satellite: any): ThreatClassification {
    const indicators: string[] = []
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let category: 'military' | 'natural' | 'surveillance' | 'civilian' | 'unknown' = 'civilian'
    let confidence = 0.6

    const name = satellite.name?.toUpperCase() || ''

    // Military/spy satellites
    if (name.includes('SPY') || name.includes('RECON') || 
        name.includes('LACROSSE') || name.includes('KH-')) {
      category = 'surveillance'
      level = 'high'
      confidence = 0.95
      indicators.push('Surveillance satellite')
    }

    // Military communication
    if (name.includes('MILSTAR') || name.includes('DSCS') || 
        name.includes('WGS') || name.includes('AEHF')) {
      category = 'military'
      level = 'medium'
      confidence = 0.9
      indicators.push('Military communications')
    }

    return { level, category, confidence, indicators }
  }

  static classifyEarthquake(earthquake: any): ThreatClassification {
    const indicators: string[] = []
    let level: 'low' | 'medium' | 'high' | 'critical' = 'low'
    const category = 'natural'
    const confidence = 0.95

    const magnitude = earthquake.magnitude || 0

    if (magnitude >= 7.0) {
      level = 'critical'
      indicators.push(`Major earthquake: M${magnitude}`)
    } else if (magnitude >= 5.0) {
      level = 'high'
      indicators.push(`Strong earthquake: M${magnitude}`)
    } else if (magnitude >= 3.0) {
      level = 'medium'
      indicators.push(`Moderate earthquake: M${magnitude}`)
    }

    // Recent earthquakes are more concerning
    const timeSince = Date.now() - new Date(earthquake.time).getTime()
    if (timeSince < 3600000) { // Less than 1 hour
      indicators.push('Recent seismic activity')
    }

    return { level, category, confidence, indicators }
  }

  static classifyWildfire(fire: any): ThreatClassification {
    const indicators: string[] = []
    let level: 'low' | 'medium' | 'high' | 'critical' = 'medium'
    const category = 'natural'
    const confidence = 0.8

    const brightness = fire.brightness || 0
    const confidence_level = fire.confidence || 0

    if (brightness > 400) {
      level = 'high'
      indicators.push(`High intensity fire: ${brightness}K`)
    }

    if (confidence_level > 80) {
      indicators.push(`High confidence detection: ${confidence_level}%`)
    }

    // Multiple fires in area increase threat
    indicators.push('Active fire hotspot')

    return { level, category, confidence: confidence_level / 100, indicators }
  }

  static getOverallThreat(classifications: ThreatClassification[]): ThreatClassification {
    if (classifications.length === 0) {
      return {
        level: 'low',
        category: 'unknown',
        confidence: 0,
        indicators: []
      }
    }

    // Find highest threat level
    const levels = ['low', 'medium', 'high', 'critical']
    const maxLevel = classifications.reduce((max, c) => {
      const currentIndex = levels.indexOf(c.level)
      const maxIndex = levels.indexOf(max)
      return currentIndex > maxIndex ? c.level : max
    }, 'low')

    // Combine all indicators
    const allIndicators = classifications.flatMap(c => c.indicators)
    
    // Average confidence
    const avgConfidence = classifications.reduce((sum, c) => sum + c.confidence, 0) / classifications.length

    // Determine primary category
    const categories = classifications.map(c => c.category)
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const primaryCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0][0] as any

    return {
      level: maxLevel as any,
      category: primaryCategory,
      confidence: avgConfidence,
      indicators: [...new Set(allIndicators)] // Remove duplicates
    }
  }
}