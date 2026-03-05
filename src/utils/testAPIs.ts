export async function testAPIs() {
  console.log('=== Testing API Connectivity ===')

  // Test OpenSky
  try {
    const clientId = import.meta.env.VITE_OPENSKY_USERNAME
    const clientSecret = import.meta.env.VITE_OPENSKY_PASSWORD
    console.log(`OpenSky credentials: ${clientId ? 'configured' : 'MISSING'}`)
    
    if (clientId && clientSecret) {
      const tokenResponse = await fetch('https://opensky-network.org/api/v2/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials'
        }),
        signal: AbortSignal.timeout(10000)
      })
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        const token = tokenData.access_token
        
        const response = await fetch('https://opensky-network.org/api/states/all', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(10000)
        })
        console.log(`OpenSky API: ${response.ok ? '✓ OK' : `✗ ${response.status}`}`)
      } else {
        console.log(`OpenSky OAuth: ✗ ${tokenResponse.status}`)
      }
    }
  } catch (e) {
    console.error(`OpenSky API: ✗ ${e}`)
  }

  // Test CelesTrak
  try {
    const response = await fetch('https://celestrak.org/SOCRATES/query.php?TYPE=active', {
      signal: AbortSignal.timeout(10000)
    })
    console.log(`CelesTrak API: ${response.ok ? '✓ OK' : `✗ ${response.status}`}`)
  } catch (e) {
    console.error(`CelesTrak API: ✗ ${e}`)
  }

  // Test USGS
  try {
    const response = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=1', {
      signal: AbortSignal.timeout(10000)
    })
    console.log(`USGS API: ${response.ok ? '✓ OK' : `✗ ${response.status}`}`)
  } catch (e) {
    console.error(`USGS API: ✗ ${e}`)
  }

  // Test NASA FIRMS
  try {
    const apiKey = import.meta.env.VITE_NASA_FIRMS_KEY
    console.log(`NASA FIRMS key: ${apiKey ? 'configured' : 'MISSING'}`)
    
    if (apiKey) {
      const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/key=${apiKey}/format=csv/country=WORLD/dayrange=1`, {
        signal: AbortSignal.timeout(10000)
      })
      console.log(`NASA FIRMS API: ${response.ok ? '✓ OK' : `✗ ${response.status}`}`)
    }
  } catch (e) {
    console.error(`NASA FIRMS API: ✗ ${e}`)
  }

  console.log('=== API Test Complete ===')
}
