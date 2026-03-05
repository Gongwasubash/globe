import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { region = 'global', limit = 20 } = req.query

    // Simulate news feed data (in production, would fetch from RSS/GDELT)
    const mockNews = generateMockNews(region as string, parseInt(limit as string))
    
    res.status(200).json({
      news: mockNews,
      timestamp: new Date().toISOString(),
      region,
      total: mockNews.length
    })
  } catch (error) {
    console.error('News API error:', error)
    res.status(500).json({ error: 'Failed to fetch news' })
  }
}

function generateMockNews(region: string, limit: number) {
  const newsTypes = ['BREAKING', 'ALERT', 'UPDATE', 'REPORT']
  const sources = ['Reuters', 'AP', 'BBC', 'CNN', 'Local News']
  
  const templates = [
    'Seismic activity detected in {region}',
    'Aircraft movement reported over {region}',
    'Maritime vessel activity in {region} waters',
    'Weather system approaching {region}',
    'Infrastructure monitoring update for {region}',
    'Transportation network status in {region}',
    'Emergency services activity in {region}',
    'Border crossing activity near {region}'
  ]

  return Array.from({ length: limit }, (_, i) => ({
    id: `news-${Date.now()}-${i}`,
    type: newsTypes[Math.floor(Math.random() * newsTypes.length)],
    title: templates[Math.floor(Math.random() * templates.length)].replace('{region}', region),
    source: sources[Math.floor(Math.random() * sources.length)],
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    priority: Math.floor(Math.random() * 5) + 1,
    coordinates: region === 'nepal' ? 
      { lat: 28.3949 + (Math.random() - 0.5) * 2, lon: 84.1240 + (Math.random() - 0.5) * 2 } :
      { lat: (Math.random() - 0.5) * 180, lon: (Math.random() - 0.5) * 360 }
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}