/**
 * Simple Real-Time Satellite Data Fetcher
 * Uses free APIs: N2YO, CelesTrak
 */

export interface SimpleSatelliteData {
  id: string
  name: string
  lat: number
  lon: number
  altitude: number
  type: string
}

// N2YO API - Real-time satellite positions (free, no key needed)
export async function getN2YOSatellites(): Promise<SimpleSatelliteData[]> {
  try {
    console.log('Fetching satellites from N2YO...')
    
    // Get satellites above Nepal region
    const response = await fetch(
      'https://api.n2yo.com/rest/v1/satellite/above/28.3949/84.1240/0/10/&apiKey=demo',
      { signal: AbortSignal.timeout(15000) }
    )

    if (!response.ok) {
      console.error(`N2YO error: ${response.status}`)
      return []
    }

    const data = await response.json()
    if (!data.above) return []

    const satellites = data.above.map((sat: any) => ({
      id: String(sat.satid),
      name: sat.satname,
      lat: sat.satlat,
      lon: sat.satlon,
      altitude: sat.satalt * 1000, // km to meters
      type: classifySatellite(sat.satname)
    }))

    console.log(`✓ N2YO: ${satellites.length} satellites`)
    return satellites
  } catch (e) {
    console.error('N2YO error:', e instanceof Error ? e.message : e)
    return []
  }
}

// CelesTrak API - TLE data for all active satellites
export async function getCelesTrakSatellites(): Promise<SimpleSatelliteData[]> {
  try {
    console.log('Fetching satellites from CelesTrak...')
    
    const response = await fetch(
      'https://celestrak.org/SOCRATES/query.php?TYPE=active',
      { signal: AbortSignal.timeout(15000) }
    )

    if (!response.ok) {
      console.error(`CelesTrak error: ${response.status}`)
      return []
    }

    const text = await response.text()
    const satellites = parseTLE(text)

    console.log(`✓ CelesTrak: ${satellites.length} satellites`)
    return satellites
  } catch (e) {
    console.error('CelesTrak error:', e instanceof Error ? e.message : e)
    return []
  }
}

// Parse TLE format
function parseTLE(tleText: string): SimpleSatelliteData[] {
  const lines = tleText.split('\n').filter(l => l.trim())
  const satellites: SimpleSatelliteData[] = []

  for (let i = 0; i < lines.length - 1; i += 3) {
    try {
      const name = lines[i].trim()
      const tle1 = lines[i + 1].trim()
      const tle2 = lines[i + 2].trim()

      if (!name || !tle1 || !tle2) continue

      const satNum = tle1.slice(2, 7).trim()

      satellites.push({
        id: satNum,
        name,
        lat: 0,
        lon: 0,
        altitude: 400000, // Default altitude in meters
        type: classifySatellite(name)
      })
    } catch (e) {
      continue
    }
  }

  return satellites
}

// Classify satellite type
function classifySatellite(name: string): string {
  const lower = name.toLowerCase()
  
  if (lower.includes('gps') || lower.includes('navstar')) return 'GPS'
  if (lower.includes('weather') || lower.includes('noaa') || lower.includes('goes')) return 'Weather'
  if (lower.includes('intelsat') || lower.includes('telesat') || lower.includes('iridium')) return 'Communications'
  if (lower.includes('landsat') || lower.includes('sentinel') || lower.includes('modis')) return 'Earth Observation'
  if (lower.includes('iss') || lower.includes('soyuz')) return 'Space Station'
  
  return 'Other'
}

// Get all satellites
export async function getAllRealSatellites(): Promise<SimpleSatelliteData[]> {
  console.log('=== Fetching REAL satellite data ===')

  const [n2yo, celestrak] = await Promise.allSettled([
    getN2YOSatellites(),
    getCelesTrakSatellites()
  ])

  const allSatellites: SimpleSatelliteData[] = []

  if (n2yo.status === 'fulfilled') {
    allSatellites.push(...n2yo.value)
  }

  if (celestrak.status === 'fulfilled') {
    allSatellites.push(...celestrak.value)
  }

  // Deduplicate by name
  const unique = Array.from(
    new Map(allSatellites.map(s => [s.name, s])).values()
  )

  console.log(`Total unique satellites: ${unique.length}`)
  return unique
}
