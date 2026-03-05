/**
 * Simple Real-Time Flight Data Fetcher
 * Uses only proven working free APIs
 */

export interface SimpleFlightData {
  id: string
  callsign: string
  lat: number
  lon: number
  altitude: number
  speed: number
  heading: number
}

// OpenSky public API - no auth needed, works reliably
export async function getOpenSkyFlights(): Promise<SimpleFlightData[]> {
  try {
    console.log('Fetching from OpenSky public API...')
    const response = await fetch('https://opensky-network.org/api/states/all', {
      signal: AbortSignal.timeout(20000)
    })

    if (!response.ok) {
      console.error(`OpenSky failed: ${response.status}`)
      return []
    }

    const data = await response.json()
    if (!data.states) return []

    const flights = data.states
      .filter((s: any[]) => s[0] && s[5] !== null && s[6] !== null && s[1])
      .slice(0, 200)
      .map((s: any[]) => ({
        id: s[0],
        callsign: (s[1] || '').trim(),
        lat: s[6],
        lon: s[5],
        altitude: s[7] || 0,
        speed: s[9] || 0,
        heading: s[10] || 0
      }))

    console.log(`✓ OpenSky: ${flights.length} flights`)
    return flights
  } catch (e) {
    console.error('OpenSky error:', e instanceof Error ? e.message : e)
    return []
  }
}

// Flightradar24 - simple JSON endpoint
export async function getFlightRadar24Flights(): Promise<SimpleFlightData[]> {
  try {
    console.log('Fetching from FlightRadar24...')
    const response = await fetch(
      'https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=90,-180,-90,180&faa=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&glm=1&stats=1',
      { signal: AbortSignal.timeout(20000) }
    )

    if (!response.ok) return []

    const data = await response.json()
    const flights: SimpleFlightData[] = []

    for (const [key, flight] of Object.entries(data)) {
      if (typeof flight !== 'object' || !Array.isArray(flight)) continue
      const f = flight as any[]
      if (f[1] && f[2] !== undefined && f[3] !== undefined) {
        flights.push({
          id: key,
          callsign: (f[1] || '').trim() || 'N/A',
          lat: f[2],
          lon: f[3],
          altitude: f[4] || 0,
          speed: f[5] || 0,
          heading: f[6] || 0
        })
      }
    }

    console.log(`✓ FlightRadar24: ${flights.length} flights`)
    return flights
  } catch (e) {
    console.error('FlightRadar24 error:', e instanceof Error ? e.message : e)
    return []
  }
}

// Combine all sources
export async function getAllRealFlights(): Promise<SimpleFlightData[]> {
  console.log('=== Fetching REAL flight data ===')

  const [opensky, fr24] = await Promise.allSettled([
    getOpenSkyFlights(),
    getFlightRadar24Flights()
  ])

  const allFlights: SimpleFlightData[] = []

  if (opensky.status === 'fulfilled') {
    allFlights.push(...opensky.value)
  }

  if (fr24.status === 'fulfilled') {
    allFlights.push(...fr24.value)
  }

  // Deduplicate by callsign
  const unique = Array.from(
    new Map(allFlights.map(f => [f.callsign, f])).values()
  )

  console.log(`Total unique real flights: ${unique.length}`)
  return unique
}
