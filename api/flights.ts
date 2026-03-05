// Vercel Edge Function for flight data proxy
export const config = { runtime: 'edge' }

interface FlightState {
  id: string
  callsign: string
  lat: number | null
  lon: number | null
  alt: number | null
  heading: number | null
  speed: number | null
  country: string
  onGround: boolean
  lastUpdated: Date
}

export default async function handler(req: Request) {
  try {
    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers })
    }

    // Get OpenSky credentials from environment
    const username = process.env.VITE_OPENSKY_USERNAME
    const password = process.env.VITE_OPENSKY_PASSWORD

    // Fetch from OpenSky Network with authentication for better rate limits
    const openSkyUrl = 'https://opensky-network.org/api/states/all'
    
    const fetchOptions: RequestInit = {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': 'Geospatial-Dashboard/1.0'
      }
    }

    // Add authentication if credentials are available
    if (username && password) {
      const auth = btoa(`${username}:${password}`)
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Basic ${auth}`
      }
    }
    
    const response = await fetch(openSkyUrl, fetchOptions)

    if (!response.ok) {
      throw new Error(`OpenSky API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.states) {
      return Response.json({ flights: [], count: 0, source: 'opensky' }, { headers })
    }

    // Normalize OpenSky data format
    const flights: FlightState[] = data.states
      .filter((state: any[]) => state.length > 10 && state[6] && state[5]) // Has lat/lon
      .map((state: any[]) => ({
        id: state[0], // ICAO24
        callsign: (state[1] || 'UNKNOWN').trim(),
        lat: state[6],
        lon: state[5], 
        alt: state[7], // meters
        heading: state[10],
        speed: state[9], // m/s
        country: state[2] || 'UNKNOWN',
        onGround: state[8] || false,
        lastUpdated: new Date()
      }))
      .slice(0, 1000) // Limit to 1000 flights for performance

    return Response.json({
      flights,
      count: flights.length,
      source: 'opensky',
      timestamp: new Date().toISOString()
    }, { headers })

  } catch (error) {
    console.error('Flight API error:', error)
    
    return Response.json({
      error: 'Failed to fetch flight data',
      message: error instanceof Error ? error.message : 'Unknown error',
      flights: [],
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