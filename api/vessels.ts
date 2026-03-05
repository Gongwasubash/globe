import { NextRequest, NextResponse } from 'next/server'

interface Vessel {
  mmsi: number
  name: string
  lat: number
  lon: number
  course: number
  speed: number
  heading: number
  type: string
  flag: string
  timestamp: number
}

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const bounds = searchParams.get('bounds') // "lat1,lon1,lat2,lon2"
    const vesselType = searchParams.get('type') // "cargo", "tanker", "military", etc.
    
    // Parse bounds or use global view
    const [minLat, minLon, maxLat, maxLon] = bounds 
      ? bounds.split(',').map(Number)
      : [-90, -180, 90, 180]

    // Fetch from multiple AIS sources
    const vessels = await Promise.allSettled([
      fetchMarineTraffic(minLat, minLon, maxLat, maxLon, vesselType),
      fetchVesselFinder(minLat, minLon, maxLat, maxLon, vesselType),
      fetchOpenAIS(minLat, minLon, maxLat, maxLon, vesselType)
    ])

    // Combine and deduplicate results
    const allVessels: Vessel[] = []
    vessels.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        allVessels.push(...result.value)
      }
    })

    // Remove duplicates by MMSI
    const uniqueVessels = allVessels.reduce((acc, vessel) => {
      if (!acc.find(v => v.mmsi === vessel.mmsi)) {
        acc.push(vessel)
      }
      return acc
    }, [] as Vessel[])

    return NextResponse.json({
      vessels: uniqueVessels,
      count: uniqueVessels.length,
      timestamp: Date.now()
    })

  } catch (error) {
    console.error('Vessels API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vessel data' },
      { status: 500 }
    )
  }
}

async function fetchMarineTraffic(minLat: number, minLon: number, maxLat: number, maxLon: number, type?: string): Promise<Vessel[]> {
  // MarineTraffic API (requires API key for production)
  const apiKey = process.env.MARINETRAFFIC_API_KEY
  if (!apiKey) return []

  const url = `https://services.marinetraffic.com/api/exportvessels/v:8/${apiKey}/protocol:jsono/minlat:${minLat}/maxlat:${maxLat}/minlon:${minLon}/maxlon:${maxLon}`
  
  const response = await fetch(url)
  const data = await response.json()
  
  return data.map((vessel: any) => ({
    mmsi: vessel.MMSI,
    name: vessel.SHIPNAME,
    lat: vessel.LAT,
    lon: vessel.LON,
    course: vessel.COURSE,
    speed: vessel.SPEED,
    heading: vessel.HEADING,
    type: vessel.SHIPTYPE,
    flag: vessel.FLAG,
    timestamp: vessel.TIMESTAMP
  }))
}

async function fetchVesselFinder(minLat: number, minLon: number, maxLat: number, maxLon: number, type?: string): Promise<Vessel[]> {
  // VesselFinder API (free tier available)
  try {
    const url = `https://www.vesselfinder.com/api/pub/click/${minLat}/${minLon}/${maxLat}/${maxLon}/2/0`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const data = await response.json()
    
    return data.vessels?.map((vessel: any) => ({
      mmsi: vessel.mmsi,
      name: vessel.name || 'Unknown',
      lat: vessel.lat,
      lon: vessel.lon,
      course: vessel.course || 0,
      speed: vessel.speed || 0,
      heading: vessel.heading || 0,
      type: vessel.type || 'Unknown',
      flag: vessel.flag || 'Unknown',
      timestamp: Date.now()
    })) || []
    
  } catch (error) {
    console.error('VesselFinder error:', error)
    return []
  }
}

async function fetchOpenAIS(minLat: number, minLon: number, maxLat: number, maxLon: number, type?: string): Promise<Vessel[]> {
  // Open AIS data sources (free)
  try {
    // This is a placeholder for open AIS sources
    // You can integrate with services like:
    // - AISHub.net
    // - ShipXplorer
    // - OpenCPN AIS feeds
    
    return []
    
  } catch (error) {
    console.error('OpenAIS error:', error)
    return []
  }
}