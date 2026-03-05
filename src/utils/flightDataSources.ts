/**
 * Live Flight Data Sources
 * Multiple free APIs for real-time aircraft tracking
 */

export interface FlightData {
  id: string
  callsign: string
  lat: number
  lon: number
  altitude: number
  speed: number
  heading: number
  country: string
  aircraft: string
  source: string
}

// ============================================================================
// 1. OPENSKY NETWORK (Best - Free tier available)
// ============================================================================
let openSkyToken: string | null = null
let tokenExpiry: number = 0

async function getOpenSkyToken(): Promise<string | null> {
  try {
    if (openSkyToken && Date.now() < tokenExpiry) {
      return openSkyToken
    }

    const clientId = import.meta.env.VITE_OPENSKY_USERNAME
    const clientSecret = import.meta.env.VITE_OPENSKY_PASSWORD

    if (!clientId || !clientSecret) return null

    console.log('Getting OpenSky OAuth token...')
    const response = await fetch('https://opensky-network.org/api/v2/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }).toString()
    })

    if (!response.ok) {
      console.error(`OAuth error: ${response.status}`)
      return null
    }

    const data = await response.json()
    openSkyToken = data.access_token
    tokenExpiry = Date.now() + (data.expires_in * 1000)
    console.log('✓ OpenSky token obtained')
    return openSkyToken
  } catch (e) {
    console.error('Token error:', e instanceof Error ? e.message : e)
    return null
  }
}

export async function fetchFromOpenSky(): Promise<FlightData[]> {
  try {
    const token = await getOpenSkyToken()
    
    let url = 'https://opensky-network.org/api/states/all'
    const headers: any = {}
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log('Using authenticated OpenSky API')
    } else {
      console.log('Using public OpenSky API')
    }
    
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000)
    })
    
    if (!response.ok) {
      console.error(`OpenSky ${response.status}`)
      return []
    }
    
    const data = await response.json()
    if (!data.states || data.states.length === 0) {
      console.warn('OpenSky returned no flights')
      return []
    }
    
    const flights = data.states
      .filter((s: any[]) => s[5] !== null && s[6] !== null && s[1])
      .slice(0, 150)
      .map((s: any[]) => ({
        id: s[0],
        callsign: (s[1] || '').trim(),
        lat: s[6],
        lon: s[5],
        altitude: s[7] || 0,
        speed: s[9] || 0,
        heading: s[10] || 0,
        country: s[2] || 'Unknown',
        aircraft: s[8] ? 'In Air' : 'On Ground',
        source: 'OpenSky'
      }))
    
    console.log(`✓ OpenSky: ${flights.length} real flights`)
    return flights
  } catch (e) {
    console.error('OpenSky error:', e instanceof Error ? e.message : e)
    return []
  }
}

// ============================================================================
// 2. ADSBEXCHANGE (Military + Civilian flights)
// ============================================================================
export async function fetchFromADSBExchange(): Promise<FlightData[]> {
  try {
    const response = await fetch('https://adsbexchange.com/api/aircraft/json/', {
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) {
      console.error(`ADSBExchange ${response.status}`)
      return []
    }
    
    const data = await response.json()
    if (!data.aircraft) return []
    
    return data.aircraft
      .filter((a: any) => a.lat && a.lon)
      .slice(0, 100)
      .map((a: any) => ({
        id: a.icao || a.hex,
        callsign: a.flight?.trim() || 'N/A',
        lat: a.lat,
        lon: a.lon,
        altitude: a.alt_baro || a.alt_geom || 0,
        speed: a.gs || 0,
        heading: a.track || 0,
        country: a.country || 'Unknown',
        aircraft: a.type || 'Unknown',
        source: 'ADSBExchange'
      }))
  } catch (e) {
    console.error('ADSBExchange error:', e instanceof Error ? e.message : e)
    return []
  }
}

// ============================================================================
// 3. FLIGHTRADAR24 (Limited free data)
// ============================================================================
export async function fetchFromFlightRadar24(): Promise<FlightData[]> {
  try {
    const response = await fetch(
      'https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=90,-180,-90,180&faa=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&glm=1&stats=1',
      { signal: AbortSignal.timeout(10000) }
    )
    
    if (!response.ok) {
      console.error(`FlightRadar24 ${response.status}`)
      return []
    }
    
    const data = await response.json()
    const flights: FlightData[] = []
    
    for (const [key, flight] of Object.entries(data)) {
      if (key === 'version' || key === 'stats' || !Array.isArray(flight)) continue
      
      const f = flight as any[]
      if (f[1] && f[2]) {
        flights.push({
          id: key,
          callsign: f[1]?.trim() || 'N/A',
          lat: f[2],
          lon: f[3],
          altitude: f[4] || 0,
          speed: f[5] || 0,
          heading: f[6] || 0,
          country: f[11] || 'Unknown',
          aircraft: f[8] || 'Unknown',
          source: 'FlightRadar24'
        })
      }
    }
    
    return flights.slice(0, 100)
  } catch (e) {
    console.error('FlightRadar24 error:', e instanceof Error ? e.message : e)
    return []
  }
}

// ============================================================================
// 4. AVIATIONSTACK (Real-time flights + routes + airlines)
// ============================================================================
export async function fetchFromAviationStack(apiKey?: string): Promise<FlightData[]> {
  try {
    if (!apiKey) return []
    
    const response = await fetch(
      `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&limit=100`,
      { signal: AbortSignal.timeout(15000) }
    )
    
    if (!response.ok) {
      console.error(`AviationStack ${response.status}`)
      return []
    }
    
    const data = await response.json()
    if (!data.data || data.data.length === 0) return []
    
    const flights = data.data
      .filter((f: any) => f.live?.latitude && f.live?.longitude)
      .map((f: any) => ({
        id: f.flight?.iata || f.flight?.icao || Math.random().toString(),
        callsign: f.flight?.iata || f.flight?.icao || 'N/A',
        lat: f.live.latitude,
        lon: f.live.longitude,
        altitude: f.live.altitude || 0,
        speed: f.live.speed_horizontal || 0,
        heading: f.live.direction || 0,
        country: f.airline?.country_name || 'Unknown',
        aircraft: f.aircraft?.iata || 'Unknown',
        source: 'AviationStack'
      }))
    
    console.log(`✓ AviationStack: ${flights.length} real flights`)
    return flights
  } catch (e) {
    console.error('AviationStack error:', e instanceof Error ? e.message : e)
    return []
  }
}

// ============================================================================
// 5. AVIATIONSTACK ROUTES (Airline routes)
// ============================================================================
export async function fetchAviationStackRoutes(apiKey?: string): Promise<any[]> {
  try {
    if (!apiKey) return []
    
    const response = await fetch(
      `https://api.aviationstack.com/v1/routes?access_key=${apiKey}&limit=100`,
      { signal: AbortSignal.timeout(10000) }
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.data || []
  } catch (e) {
    console.error('AviationStack routes error:', e instanceof Error ? e.message : e)
    return []
  }
}

// ============================================================================
// 6. AVIATIONSTACK AIRPORTS
// ============================================================================
export async function fetchAviationStackAirports(apiKey?: string): Promise<any[]> {
  try {
    if (!apiKey) return []
    
    const response = await fetch(
      `https://api.aviationstack.com/v1/airports?access_key=${apiKey}&limit=100`,
      { signal: AbortSignal.timeout(10000) }
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.data || []
  } catch (e) {
    console.error('AviationStack airports error:', e instanceof Error ? e.message : e)
    return []
  }
}

// ============================================================================
// 7. AVIATIONSTACK AIRLINES
// ============================================================================
export async function fetchAviationStackAirlines(apiKey?: string): Promise<any[]> {
  try {
    if (!apiKey) return []
    
    const response = await fetch(
      `https://api.aviationstack.com/v1/airlines?access_key=${apiKey}&limit=100`,
      { signal: AbortSignal.timeout(10000) }
    )
    
    if (!response.ok) return []
    
    const data = await response.json()
    return data.data || []
  } catch (e) {
    console.error('AviationStack airlines error:', e instanceof Error ? e.message : e)
    return []
  }
}

// ============================================================================
// 5. COMBINED FETCH (Best approach)
// ============================================================================
export async function fetchAllFlights(): Promise<FlightData[]> {
  console.log('Fetching REAL live flight data...')
  
  const aviationStackKey = import.meta.env.VITE_AVIATIONSTACK_KEY
  
  const [opensky, adsb, fr24, aviationStack] = await Promise.allSettled([
    fetchFromOpenSky(),
    fetchFromADSBExchange(),
    fetchFromFlightRadar24(),
    aviationStackKey ? fetchFromAviationStack(aviationStackKey) : Promise.resolve([])
  ])
  
  const allFlights: FlightData[] = []
  
  if (opensky.status === 'fulfilled' && opensky.value.length > 0) {
    allFlights.push(...opensky.value)
  }
  
  if (adsb.status === 'fulfilled' && adsb.value.length > 0) {
    allFlights.push(...adsb.value)
  }
  
  if (fr24.status === 'fulfilled' && fr24.value.length > 0) {
    allFlights.push(...fr24.value)
  }
  
  if (aviationStack.status === 'fulfilled' && aviationStack.value.length > 0) {
    allFlights.push(...aviationStack.value)
  }
  
  const unique = Array.from(
    new Map(allFlights.map(f => [f.callsign, f])).values()
  )
  
  console.log(`Total real flights: ${unique.length}`)
  return unique
}
