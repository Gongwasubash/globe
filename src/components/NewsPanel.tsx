import React, { useState, useEffect } from 'react'
import { Newspaper, AlertCircle, Clock, MapPin } from 'lucide-react'

interface NewsItem {
  id: string
  type: string
  title: string
  source: string
  timestamp: string
  priority: number
  coordinates: { lat: number; lon: number }
}

interface NewsPanelProps {
  region: string
  isVisible: boolean
  onNewsClick?: (coordinates: { lat: number; lon: number }) => void
}

export default function NewsPanel({ region, isVisible, onNewsClick }: NewsPanelProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isVisible) {
      fetchNews()
      const interval = setInterval(fetchNews, 30000) // Update every 30 seconds
      return () => clearInterval(interval)
    }
  }, [region, isVisible])

  const fetchNews = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/news?region=${region}&limit=15`)
      if (response.ok) {
        const data = await response.json()
        setNews(data.news)
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-400 border-red-500/30'
    if (priority >= 3) return 'text-yellow-400 border-yellow-500/30'
    return 'text-green-400 border-green-500/30'
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 h-80 bg-black/90 border border-green-500/30 rounded-lg backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-green-500/30 bg-green-500/10">
        <Newspaper className="w-4 h-4 text-green-400" />
        <span className="text-green-300 font-bold font-mono text-sm">LIVE INTEL FEED</span>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
          <span className="text-xs text-green-500">{region.toUpperCase()}</span>
        </div>
      </div>

      <div className="h-full overflow-y-auto p-2 space-y-2">
        {news.map((item) => (
          <div
            key={item.id}
            className={`p-2 rounded border cursor-pointer hover:bg-white/5 transition-colors ${getPriorityColor(item.priority)}`}
            onClick={() => onNewsClick?.(item.coordinates)}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <AlertCircle className="w-3 h-3 mt-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-current/20 px-1 rounded">
                    {item.type}
                  </span>
                  <span className="text-xs opacity-60">{item.source}</span>
                </div>
                <p className="text-xs leading-tight mb-1">{item.title}</p>
                <div className="flex items-center gap-2 text-xs opacity-60">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  <MapPin className="w-3 h-3 ml-auto" />
                  <span>{item.coordinates.lat.toFixed(2)}, {item.coordinates.lon.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {news.length === 0 && !loading && (
          <div className="text-center text-green-500/60 py-8">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent intel available</p>
          </div>
        )}
      </div>
    </div>
  )
}