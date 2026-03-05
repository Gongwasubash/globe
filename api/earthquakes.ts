// Vercel Edge Function for earthquake data proxy
export const config = { runtime: 'edge' }

interface Earthquake {
  id: string
  magnitude: number
  lat: number
  lon: number
  depth: number
  place: string
  time: Date
  url?: string
  felt?: number
  tsunami: boolean
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
    const minMagnitude = url.searchParams.get('minmag') || '2.5'
    const days = parseInt(url.searchParams.get('days') || '1')

    // Calculate start time
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startTime = startDate.toISOString().split('T')[0]

    // USGS Earthquake API parameters
    const params = new URLSearchParams({
      format: 'geojson',
      starttime: startTime,
      minmagnitude: minMagnitude,
      orderby: 'time-asc',
      limit: '1000'
    })

    const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`

    const response = await fetch(usgsUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Geospatial-Dashboard/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`USGS API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.features) {
      return Response.json({ earthquakes: [], count: 0, source: 'usgs' }, { headers })
    }

    // Normalize USGS GeoJSON format
    const earthquakes: Earthquake[] = data.features
      .map((feature: any) => {
        const props = feature.properties
        const coords = feature.geometry.coordinates

        return {
          id: feature.id,
          magnitude: props.mag,
          lat: coords[1],
          lon: coords[0],
          depth: coords[2] || 0,
          place: props.place || 'Unknown location',
          time: new Date(props.time),
          url: props.url,
          felt: props.felt,
          tsunami: props.tsunami === 1
        }
      })
      .filter((eq: Earthquake) => eq.magnitude && eq.lat && eq.lon)
      .sort((a, b) => b.time.getTime() - a.time.getTime()) // Most recent first

    return Response.json({
      earthquakes,
      count: earthquakes.length,
      minMagnitude: parseFloat(minMagnitude),
      days,
      source: 'usgs',
      timestamp: new Date().toISOString()
    }, { headers })

  } catch (error) {
    console.error('Earthquake API error:', error)
    
    return Response.json({
      error: 'Failed to fetch earthquake data',
      message: error instanceof Error ? error.message : 'Unknown error',
      earthquakes: [],
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