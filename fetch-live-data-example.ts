import { fetchFlights, fetchSatellites, fetchEarthquakes, fetchWildfires } from './src/utils/api-helpers'

/**
 * Example: Fetch live data from all available sources
 */
async function fetchAllLiveData() {
  console.log('Fetching live data...')
  
  try {
    // Fetch all data sources concurrently
    const [flights, satellites, earthquakes, wildfires] = await Promise.all([
      fetchFlights(),
      fetchSatellites(), 
      fetchEarthquakes(),
      fetchWildfires(process.env.NASA_FIRMS_API_KEY || '', 'USA') // Optional: specify country
    ])

    console.log(`✅ Fetched ${flights.length} flights`)
    console.log(`✅ Fetched ${satellites.length} satellites`) 
    console.log(`✅ Fetched ${earthquakes.length} earthquakes`)
    console.log(`✅ Fetched ${wildfires.length} wildfire detections`)

    return { flights, satellites, earthquakes, wildfires }
  } catch (error) {
    console.error('❌ Error fetching live data:', error)
    throw error
  }
}

// Run the example
fetchAllLiveData()
  .then(data => {
    console.log('Live data fetched successfully:', {
      totalFlights: data.flights.length,
      totalSatellites: data.satellites.length, 
      totalEarthquakes: data.earthquakes.length,
      totalWildfires: data.wildfires.length
    })
  })
  .catch(console.error)