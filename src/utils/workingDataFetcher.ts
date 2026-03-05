export interface FlightData {
  id: string
  callsign: string
  lat: number
  lon: number
  altitude: number
  speed: number
  heading: number
}

export interface SatelliteData {
  id: string
  name: string
  lat: number
  lon: number
  altitude: number
  type: string
}

const DEMO_FLIGHTS: FlightData[] = [
  { id: '1', callsign: 'BA123', lat: 40.7128, lon: -74.0060, altitude: 10000, speed: 450, heading: 90 },
  { id: '2', callsign: 'UA456', lat: 35.6762, lon: 139.6503, altitude: 11000, speed: 480, heading: 180 },
  { id: '3', callsign: 'AF789', lat: 48.8566, lon: 2.3522, altitude: 9500, speed: 420, heading: 270 },
  { id: '4', callsign: 'SQ234', lat: 1.3521, lon: 103.8198, altitude: 12000, speed: 500, heading: 45 },
  { id: '5', callsign: 'AI567', lat: 28.6139, lon: 77.2090, altitude: 10500, speed: 460, heading: 135 },
  { id: '6', callsign: 'JL890', lat: 35.5307, lon: 139.7673, altitude: 11500, speed: 490, heading: 225 },
  { id: '7', callsign: 'LH012', lat: 52.3667, lon: 13.5000, altitude: 10200, speed: 470, heading: 315 },
  { id: '8', callsign: 'KL345', lat: 52.3086, lon: 4.7639, altitude: 9800, speed: 440, heading: 60 },
]

const DEMO_SATELLITES: SatelliteData[] = [
  { id: '25544', name: 'ISS', lat: 0, lon: 0, altitude: 408000, type: 'Space Station' },
  { id: '39444', name: 'NOAA 18', lat: 0, lon: 0, altitude: 870000, type: 'Weather' },
  { id: '25544', name: 'HUBBLE', lat: 0, lon: 0, altitude: 559000, type: 'Earth Observation' },
  { id: '39084', name: 'GOES 16', lat: 0, lon: 0, altitude: 35786000, type: 'Weather' },
  { id: '40014', name: 'SENTINEL-1A', lat: 0, lon: 0, altitude: 693000, type: 'Earth Observation' },
]

export async function getFlights(): Promise<FlightData[]> {
  try {
    console.log('Fetching flights from OpenSky...')
    const response = await fetch('https://opensky-network.org/api/states/all', {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) throw new Error(`Status ${response.status}`)

    const data = await response.json()
    if (!data.states || data.states.length === 0) throw new Error('No flights')

    const flights = data.states
      .filter((s: any[]) => s[0] && s[5] !== null && s[6] !== null && s[1])
      .slice(0, 100)
      .map((s: any[]) => ({
        id: s[0],
        callsign: (s[1] || '').trim(),
        lat: s[6],
        lon: s[5],
        altitude: s[7] || 0,
        speed: s[9] || 0,
        heading: s[10] || 0
      }))

    console.log(`Got ${flights.length} real flights`)
    return flights
  } catch (e) {
    console.log('Using demo flights')
    return DEMO_FLIGHTS
  }
}

export async function getSatellites(): Promise<SatelliteData[]> {
  try {
    console.log('Fetching satellites from N2YO...')
    const response = await fetch(
      'https://api.n2yo.com/rest/v1/satellite/above/28.3949/84.1240/0/10/&apiKey=demo',
      { signal: AbortSignal.timeout(10000) }
    )

    if (!response.ok) throw new Error(`Status ${response.status}`)

    const data = await response.json()
    if (!data.above || data.above.length === 0) throw new Error('No satellites')

    const satellites = data.above.map((sat: any) => ({
      id: String(sat.satid),
      name: sat.satname,
      lat: sat.satlat,
      lon: sat.satlon,
      altitude: sat.satalt * 1000,
      type: classifySat(sat.satname)
    }))

    console.log(`Got ${satellites.length} real satellites`)
    return satellites
  } catch (e) {
    console.log('Using demo satellites')
    return DEMO_SATELLITES
  }
}

function classifySat(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('iss')) return 'Space Station'
  if (lower.includes('noaa') || lower.includes('goes')) return 'Weather'
  if (lower.includes('sentinel') || lower.includes('landsat')) return 'Earth Observation'
  if (lower.includes('gps')) return 'GPS'
  return 'Other'
}
