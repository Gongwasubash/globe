// Vercel Edge Function for satellite TLE data proxy
export const config = { runtime: 'edge' }

// Import satellite.js for position calculations
// Note: In edge runtime, we'll do basic calculations

interface Satellite {
  id: string
  name: string
  lat: number
  lon: number
  alt: number
  tle1: string
  tle2: string
  type: 'gps' | 'weather' | 'communications' | 'earth-observation' | 'space-station' | 'other'
  lastUpdated: Date
}

export default async function handler(req: Request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers })
    }

    const url = new URL(req.url)
    const category = url.searchParams.get('category') || 'active'

    // CelesTrak TLE sources
    const tleUrls: Record<string, string> = {
      active: 'https://celestrak.org/SOCRATES/query.php?TYPE=active',
      starlink: 'https://celestrak.org/SOCRATES/query.php?NAME=STARLINK',
      weather: 'https://celestrak.org/SOCRATES/query.php?GROUP=weather',
      gps: 'https://celestrak.org/SOCRATES/query.php?GROUP=gps-ops',
      iss: 'https://celestrak.org/SOCRATES/query.php?NAME=ISS'
    }

    const tleUrl = tleUrls[category] || tleUrls.active

    const response = await fetch(tleUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Geospatial-Dashboard/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`CelesTrak API returned ${response.status}`)
    }

    const tleText = await response.text()
    const satellites = parseTLE(tleText)

    return Response.json({
      satellites,
      count: satellites.length,
      category,
      source: 'celestrak',
      timestamp: new Date().toISOString()
    }, { headers })

  } catch (error) {
    console.error('Satellite API error:', error)
    
    return Response.json({
      error: 'Failed to fetch satellite data',
      message: error instanceof Error ? error.message : 'Unknown error',
      satellites: [],
      count: 0
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }
}

/**
 * Parse TLE (Two-Line Element) format
 */
function parseTLE(tleText: string): Satellite[] {
  const lines = tleText.split('\n').filter(l => l.trim())
  const satellites: Satellite[] = []

  for (let i = 0; i < lines.length - 1; i += 3) {
    try {
      const name = lines[i]?.trim()
      const tle1 = lines[i + 1]?.trim()
      const tle2 = lines[i + 2]?.trim()

      if (!name || !tle1 || !tle2) continue
      if (!tle1.startsWith('1 ') || !tle2.startsWith('2 ')) continue

      // Extract satellite number from TLE line 1
      const satNum = tle1.slice(2, 7).trim()

      satellites.push({
        id: satNum,
        name,
        lat: 0, // Will be calculated on frontend
        lon: 0,
        alt: 400000, // Default altitude in meters
        tle1,
        tle2,
        type: classifySatellite(name),
        lastUpdated: new Date()
      })
    } catch (e) {
      console.debug('Failed to parse TLE entry:', e)
    }
  }

  return satellites.slice(0, 500) // Limit for performance
}

/**
 * Classify satellite type based on name
 */
function classifySatellite(name: string): Satellite['type'] {
  const lower = name.toLowerCase()

  if (lower.includes('gps') || lower.includes('navstar') || lower.includes('glonass')) return 'gps'
  if (lower.includes('weather') || lower.includes('noaa') || lower.includes('goes') || lower.includes('metop')) return 'weather'
  if (lower.includes('intelsat') || lower.includes('telesat') || lower.includes('iridium') || lower.includes('starlink')) return 'communications'
  if (lower.includes('landsat') || lower.includes('sentinel') || lower.includes('modis') || lower.includes('terra')) return 'earth-observation'
  if (lower.includes('iss') || lower.includes('soyuz') || lower.includes('dragon') || lower.includes('station')) return 'space-station'

  return 'other'
}