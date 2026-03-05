/**
 * Comprehensive Aviation Data Service
 * Uses AviationStack API for real-time flight, route, airport, and airline data
 */

export interface AviationData {
  flights: any[]
  routes: any[]
  airports: any[]
  airlines: any[]
}

export async function fetchAviationStackData(apiKey: string): Promise<AviationData> {
  console.log('Fetching AviationStack data...')
  
  const [flights, routes, airports, airlines] = await Promise.allSettled([
    fetchFlights(apiKey),
    fetchRoutes(apiKey),
    fetchAirports(apiKey),
    fetchAirlines(apiKey)
  ])
  
  return {
    flights: flights.status === 'fulfilled' ? flights.value : [],
    routes: routes.status === 'fulfilled' ? routes.value : [],
    airports: airports.status === 'fulfilled' ? airports.value : [],
    airlines: airlines.status === 'fulfilled' ? airlines.value : []
  }
}

async function fetchFlights(apiKey: string): Promise<any[]> {\n  try {\n    const response = await fetch(\n      `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&limit=100`,\n      { signal: AbortSignal.timeout(10000) }\n    )\n    \n    if (!response.ok) {\n      console.error(`Flights ${response.status}`)\n      return []\n    }\n    \n    const data = await response.json()\n    console.log(`✓ Flights: ${data.data?.length || 0}`)\n    return data.data || []\n  } catch (e) {\n    console.error('Flights error:', e instanceof Error ? e.message : e)\n    return []\n  }\n}\n\nasync function fetchRoutes(apiKey: string): Promise<any[]> {\n  try {\n    const response = await fetch(\n      `https://api.aviationstack.com/v1/routes?access_key=${apiKey}&limit=100`,\n      { signal: AbortSignal.timeout(10000) }\n    )\n    \n    if (!response.ok) return []\n    \n    const data = await response.json()\n    console.log(`✓ Routes: ${data.data?.length || 0}`)\n    return data.data || []\n  } catch (e) {\n    console.error('Routes error:', e instanceof Error ? e.message : e)\n    return []\n  }\n}\n\nasync function fetchAirports(apiKey: string): Promise<any[]> {\n  try {\n    const response = await fetch(\n      `https://api.aviationstack.com/v1/airports?access_key=${apiKey}&limit=100`,\n      { signal: AbortSignal.timeout(10000) }\n    )\n    \n    if (!response.ok) return []\n    \n    const data = await response.json()\n    console.log(`✓ Airports: ${data.data?.length || 0}`)\n    return data.data || []\n  } catch (e) {\n    console.error('Airports error:', e instanceof Error ? e.message : e)\n    return []\n  }\n}\n\nasync function fetchAirlines(apiKey: string): Promise<any[]> {\n  try {\n    const response = await fetch(\n      `https://api.aviationstack.com/v1/airlines?access_key=${apiKey}&limit=100`,\n      { signal: AbortSignal.timeout(10000) }\n    )\n    \n    if (!response.ok) return []\n    \n    const data = await response.json()\n    console.log(`✓ Airlines: ${data.data?.length || 0}`)\n    return data.data || []\n  } catch (e) {\n    console.error('Airlines error:', e instanceof Error ? e.message : e)\n    return []\n  }\n}
