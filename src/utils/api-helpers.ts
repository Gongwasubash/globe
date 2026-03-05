import { Aircraft, Satellite, Earthquake, Wildfire } from '../types/dataLayers'
import { getFlights, getSatellites } from './workingDataFetcher'

/**
 * API helper functions for fetching data from external sources
 */

// ============================================================================
// FLIGHTS (OpenSky Network)
// ============================================================================

const OPENSKY_API = 'https://opensky-network.org/api/states/all'
let openSkyToken: string | null = null
let tokenExpiry: number = 0

async function getOpenSkyToken(): Promise<string | null> {
  try {
    const clientId = import.meta.env.VITE_OPENSKY_USERNAME
    const clientSecret = import.meta.env.VITE_OPENSKY_PASSWORD
    
    if (!clientId || !clientSecret) {
      console.warn('OpenSky credentials missing')
      return null
    }
    
    if (openSkyToken && Date.now() < tokenExpiry) {
      return openSkyToken
    }
    
    console.log('Requesting OpenSky token...')
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    })
    
    const response = await fetch('https://opensky-network.org/api/v2/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(10000)
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error(`OpenSky OAuth ${response.status}: ${error}`)
      return null
    }
    
    const data = await response.json()
    openSkyToken = data.access_token
    tokenExpiry = Date.now() + ((data.expires_in || 3600) * 1000)
    console.log('✓ OpenSky token obtained')
    return openSkyToken
  } catch (e) {
    console.error('Failed to get OpenSky token:', e instanceof Error ? e.message : e)
    return null
  }
}

export async function fetchFlights(): Promise<Aircraft[]> {
  const flightData = await getFlights()
  return flightData.map(f => ({
    id: f.id,
    callsign: f.callsign,
    lat: f.lat,
    lon: f.lon,
    alt: f.altitude,
    heading: f.heading,
    speed: f.speed,
    country: 'Unknown',
    onGround: f.altitude < 100,
    lastUpdated: new Date(),
  }))
}

// ============================================================================
// SATELLITES (CelesTrak)
// ============================================================================

const CELESTRAK_API = 'https://celestrak.org/SOCRATES/query.php?TYPE=active'

export async function fetchSatellites(): Promise<Satellite[]> {
  const satData = await getSatellites()
  return satData.map(s => ({
    id: s.id,
    name: s.name,
    lat: s.lat,
    lon: s.lon,
    alt: s.altitude,
    tle1: '',
    tle2: '',
    type: s.type as any,
    lastUpdated: new Date(),
  }))
}

// ============================================================================
// EARTHQUAKES (USGS)
// ============================================================================

const USGS_API = 'https://earthquake.usgs.gov/fdsnws/event/1/query'

export async function fetchEarthquakes(): Promise<Earthquake[]> {
  try {
    const params = new URLSearchParams({
      format: 'geojson',
      starttime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minmagnitude: '4.5',
      limit: '300'
    })
    
    const response = await fetch(`${USGS_API}?${params}`, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) {
      console.error(`USGS API error: ${response.status}`)
      return []
    }

    const data = await response.json()
    if (!data.features) return []

    const earthquakes = data.features.map((feature: any) => {
      const props = feature.properties
      const coords = feature.geometry.coordinates
      return {
        id: feature.id,
        magnitude: props.mag,
        lat: coords[1],
        lon: coords[0],
        depth: coords[2],
        place: props.place,
        time: new Date(props.time),
        url: props.url,
        felt: props.felt,
        tsunami: props.tsunami,
      }
    })
    console.log(`Fetched ${earthquakes.length} earthquakes from USGS`)
    return earthquakes
  } catch (error) {
    console.error('Failed to fetch earthquakes:', error)
    return []
  }
}

// ============================================================================
// WILDFIRES (NASA FIRMS)
// ============================================================================

export async function fetchWildfires(apiKey: string, country: string = 'WORLD'): Promise<Wildfire[]> {
  try {
    if (!apiKey) {
      console.warn('NASA FIRMS API key not configured')
      return []
    }

    const params = new URLSearchParams({
      key: apiKey,
      format: 'csv',
      country,
      dayrange: '1'
    })
    
    const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${params}`
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    
    if (!response.ok) {
      console.error(`NASA FIRMS API error: ${response.status}`)
      return []
    }

    const text = await response.text()
    const wildfires = parseFiresCSV(text)
    console.log(`Fetched ${wildfires.length} wildfires from NASA FIRMS`)
    return wildfires
  } catch (error) {
    console.error('Failed to fetch wildfires:', error)
    return []
  }
}

/**
 * Parse NASA FIRMS CSV response
 * Format: latitude,longitude,brightness,confidence,daynight,acq_date,acq_time,satellite,...
 */
function parseFiresCSV(csv: string): Wildfire[] {
  const lines = csv.split('\n').filter((l) => l.trim() && !l.startsWith('#'))
  const wildfires: Wildfire[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
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
      const satellite = (parts[7]?.trim() || 'VIIRS').split('_')[0]

      if (!lat || !lon || !brightness) continue

      wildfires.push({
        id: `${lat}_${lon}_${acqDate}_${acqTime}`,
        lat,
        lon,
        brightness,
        confidence,
        dayNight,
        acquisitionDate: new Date(acqDate),
        acquisitionTime: acqTime,
        satellite: satellite === 'MODIS' ? 'MODIS' : 'VIIRS',
      })
    } catch (e) {
      console.debug('Failed to parse fire entry', e)
    }
  }

  return wildfires
}
