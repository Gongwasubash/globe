import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

// Flights API
app.get('/api/flights', async (req, res) => {
  try {
    const username = process.env.VITE_OPENSKY_USERNAME
    const password = process.env.VITE_OPENSKY_PASSWORD
    
    const fetchOptions = {
      timeout: 10000,
      headers: { 'User-Agent': 'Geospatial-Dashboard/1.0' }
    }

    if (username && password) {
      const auth = Buffer.from(`${username}:${password}`).toString('base64')
      fetchOptions.headers.Authorization = `Basic ${auth}`
    }

    const response = await fetch('https://opensky-network.org/api/states/all', fetchOptions)
    
    if (!response.ok) {
      throw new Error(`OpenSky API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.states) {
      return res.json({ flights: [], count: 0, source: 'opensky' })
    }

    const flights = data.states
      .filter(state => state.length > 10 && state[6] && state[5])
      .map(state => ({
        id: state[0],
        callsign: (state[1] || 'UNKNOWN').trim(),
        lat: state[6],
        lon: state[5], 
        alt: state[7],
        heading: state[10],
        speed: state[9],
        country: state[2] || 'UNKNOWN',
        onGround: state[8] || false,
        lastUpdated: new Date()
      }))
      .slice(0, 1000)

    res.json({
      flights,
      count: flights.length,
      source: 'opensky',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Flight API error:', error)
    res.status(500).json({
      error: 'Failed to fetch flight data',
      message: error.message,
      flights: [],
      count: 0
    })
  }
})

// Satellites API
app.get('/api/satellites', async (req, res) => {
  try {
    const category = req.query.category || 'active'
    
    const tleUrls = {
      active: 'https://celestrak.org/SOCRATES/query.php?TYPE=active',
      starlink: 'https://celestrak.org/SOCRATES/query.php?NAME=STARLINK',
      weather: 'https://celestrak.org/SOCRATES/query.php?GROUP=weather',
      gps: 'https://celestrak.org/SOCRATES/query.php?GROUP=gps-ops',
      iss: 'https://celestrak.org/SOCRATES/query.php?NAME=ISS'
    }

    const tleUrl = tleUrls[category] || tleUrls.active

    const response = await fetch(tleUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'Geospatial-Dashboard/1.0' }
    })

    if (!response.ok) {
      throw new Error(`CelesTrak API returned ${response.status}`)
    }

    const tleText = await response.text()
    const satellites = parseTLE(tleText)

    res.json({
      satellites,
      count: satellites.length,
      category,
      source: 'celestrak',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Satellite API error:', error)
    res.status(500).json({
      error: 'Failed to fetch satellite data',
      message: error.message,
      satellites: [],
      count: 0
    })
  }
})

// Earthquakes API
app.get('/api/earthquakes', async (req, res) => {
  try {
    const params = new URLSearchParams({
      format: 'geojson',
      starttime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minmagnitude: '2.5'
    })

    const response = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`, {
      timeout: 10000,
      headers: { 'User-Agent': 'Geospatial-Dashboard/1.0' }
    })

    if (!response.ok) {
      throw new Error(`USGS API returned ${response.status}`)
    }

    const data = await response.json()
    
    const earthquakes = data.features?.map(feature => ({
      id: feature.id,
      magnitude: feature.properties.mag,
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
      depth: feature.geometry.coordinates[2],
      place: feature.properties.place,
      time: new Date(feature.properties.time),
      url: feature.properties.url,
      felt: feature.properties.felt,
      tsunami: feature.properties.tsunami
    })) || []

    res.json({
      earthquakes,
      count: earthquakes.length,
      source: 'usgs',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Earthquake API error:', error)
    res.status(500).json({
      error: 'Failed to fetch earthquake data',
      message: error.message,
      earthquakes: [],
      count: 0
    })
  }
})

// Fires API
app.get('/api/fires', async (req, res) => {
  try {
    const country = req.query.country || 'WORLD'
    const days = req.query.days || '1'
    
    const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis_c6.1/csv/MODIS_C6_1_Global_24h.csv`, {
      timeout: 15000,
      headers: { 'User-Agent': 'Geospatial-Dashboard/1.0' }
    })

    if (!response.ok) {
      throw new Error(`NASA FIRMS API returned ${response.status}`)
    }

    const csvText = await response.text()
    const wildfires = parseFiresCSV(csvText)

    res.json({
      wildfires,
      count: wildfires.length,
      source: 'nasa-firms',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Fires API error:', error)
    res.status(500).json({
      error: 'Failed to fetch wildfire data',
      message: error.message,
      wildfires: [],
      count: 0
    })
  }
})

function parseTLE(tleText) {
  const lines = tleText.split('\\n').filter(l => l.trim())
  const satellites = []

  for (let i = 0; i < lines.length - 1; i += 3) {
    try {
      const name = lines[i]?.trim()
      const tle1 = lines[i + 1]?.trim()
      const tle2 = lines[i + 2]?.trim()

      if (!name || !tle1 || !tle2) continue
      if (!tle1.startsWith('1 ') || !tle2.startsWith('2 ')) continue

      const satNum = tle1.slice(2, 7).trim()

      satellites.push({
        id: satNum,
        name,
        lat: 0,
        lon: 0,
        alt: 400000,
        tle1,
        tle2,
        type: classifySatellite(name),
        lastUpdated: new Date()
      })
    } catch (e) {
      console.debug('Failed to parse TLE entry:', e)
    }
  }

  return satellites.slice(0, 500)
}

function classifySatellite(name) {
  const lower = name.toLowerCase()

  if (lower.includes('gps') || lower.includes('navstar') || lower.includes('glonass')) return 'gps'
  if (lower.includes('weather') || lower.includes('noaa') || lower.includes('goes') || lower.includes('metop')) return 'weather'
  if (lower.includes('intelsat') || lower.includes('telesat') || lower.includes('iridium') || lower.includes('starlink')) return 'communications'
  if (lower.includes('landsat') || lower.includes('sentinel') || lower.includes('modis') || lower.includes('terra')) return 'earth-observation'
  if (lower.includes('iss') || lower.includes('soyuz') || lower.includes('dragon') || lower.includes('station')) return 'space-station'

  return 'other'
}

function parseFiresCSV(csv) {
  const lines = csv.split('\\n').filter(l => l.trim() && !l.startsWith('#'))
  const wildfires = []

  for (let i = 1; i < lines.length; i++) {
    try {
      const parts = lines[i].split(',')
      if (parts.length < 8) continue

      const lat = parseFloat(parts[0])
      const lon = parseFloat(parts[1])
      const brightness = parseFloat(parts[2])
      const confidence = parseFloat(parts[3])
      const dayNight = parts[4]?.trim()
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
        satellite: satellite === 'MODIS' ? 'MODIS' : 'VIIRS'
      })
    } catch (e) {
      console.debug('Failed to parse fire entry', e)
    }
  }

  return wildfires
}

app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`)
  console.log('Available endpoints:')
  console.log('  GET /api/flights')
  console.log('  GET /api/satellites')
  console.log('  GET /api/earthquakes')
  console.log('  GET /api/fires')
})