// Vercel Edge Function for wildfire data proxy
export const config = { runtime: 'edge' }

interface Wildfire {
  id: string
  lat: number
  lon: number
  brightness: number
  confidence: number
  dayNight: 'D' | 'N'
  acquisitionDate: Date
  acquisitionTime: string
  satellite: 'MODIS' | 'VIIRS'
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
    const country = url.searchParams.get('country') || 'WORLD'
    const days = url.searchParams.get('days') || '1'
    
    // Get NASA FIRMS API key from environment
    const apiKey = process.env.VITE_NASA_FIRMS_KEY
    
    if (!apiKey) {
      return Response.json({
        error: 'NASA FIRMS API key not configured',
        message: 'Set VITE_NASA_FIRMS_KEY environment variable',
        wildfires: [],
        count: 0
      }, { 
        status: 503,
        headers
      })
    }

    // NASA FIRMS VIIRS satellite thermal hotspots
    const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/VIIRS_SNPP_NRT/${country}/${days}`

    const response = await fetch(firmsUrl, {
      signal: AbortSignal.timeout(20000),
      headers: {
        'User-Agent': 'Geospatial-Dashboard/1.0'
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid NASA FIRMS API key')
      }
      throw new Error(`NASA FIRMS API returned ${response.status}`)
    }

    const csvText = await response.text()
    
    // Check if response is an error message
    if (csvText.includes('Invalid API key') || csvText.includes('Error')) {
      throw new Error('NASA FIRMS API error: ' + csvText.slice(0, 100))
    }

    const wildfires = parseFiresCSV(csvText)

    return Response.json({
      wildfires,
      count: wildfires.length,
      country,
      days: parseInt(days),
      source: 'nasa-firms',
      timestamp: new Date().toISOString()
    }, { headers })

  } catch (error) {
    console.error('Wildfire API error:', error)
    
    return Response.json({
      error: 'Failed to fetch wildfire data',
      message: error instanceof Error ? error.message : 'Unknown error',
      wildfires: [],
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
 * Parse NASA FIRMS CSV response
 * Format: latitude,longitude,brightness,confidence,daynight,acq_date,acq_time,satellite,...
 */
function parseFiresCSV(csv: string): Wildfire[] {
  const lines = csv.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const wildfires: Wildfire[] = []

  if (lines.length === 0) return []

  // Skip header row if present
  const startIndex = lines[0].includes('latitude') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    try {
      const parts = lines[i].split(',')
      if (parts.length < 8) continue

      const lat = parseFloat(parts[0])
      const lon = parseFloat(parts[1])
      const brightness = parseFloat(parts[2])
      const confidence = parseFloat(parts[3])
      const dayNight = parts[4]?.trim() as 'D' | 'N'
      const acqDate = parts[5]?.trim()
      const acqTime = parts[6]?.trim()
      const satellite = parts[7]?.trim()

      if (isNaN(lat) || isNaN(lon) || isNaN(brightness)) continue
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) continue

      // Create unique ID from coordinates and time
      const id = `${lat.toFixed(4)}_${lon.toFixed(4)}_${acqDate}_${acqTime}`

      wildfires.push({
        id,
        lat,
        lon,
        brightness,
        confidence: confidence || 0,
        dayNight: dayNight || 'D',
        acquisitionDate: new Date(acqDate),
        acquisitionTime: acqTime,
        satellite: satellite?.includes('MODIS') ? 'MODIS' : 'VIIRS'
      })
    } catch (e) {
      console.debug('Failed to parse fire entry:', e)
    }
  }

  // Sort by brightness (hottest first) and limit results
  return wildfires
    .sort((a, b) => b.brightness - a.brightness)
    .slice(0, 2000) // Limit for performance
}