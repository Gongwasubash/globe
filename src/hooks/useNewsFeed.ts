import { useState, useEffect, useCallback } from 'react'

interface NewsItem {
  id: string
  type: string
  title: string
  source: string
  timestamp: string
  priority: number
  coordinates: { lat: number; lon: number }
}

interface UseNewsFeedOptions {
  region?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useNewsFeed(options: UseNewsFeedOptions = {}) {
  const { region = 'global', autoRefresh = true, refreshInterval = 30000 } = options
  
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/news?region=${region}&limit=20`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setNews(data.news || [])
      setLastUpdate(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news')
      console.error('News fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [region])

  useEffect(() => {
    fetchNews()
    
    if (autoRefresh) {
      const interval = setInterval(fetchNews, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchNews, autoRefresh, refreshInterval])

  const getNewsByPriority = useCallback((minPriority: number = 1) => {
    return news.filter(item => item.priority >= minPriority)
  }, [news])

  const getRecentNews = useCallback((hours: number = 24) => {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return news.filter(item => new Date(item.timestamp) > cutoff)
  }, [news])

  return {
    news,
    loading,
    error,
    lastUpdate,
    fetchNews,
    getNewsByPriority,
    getRecentNews,
    totalCount: news.length,
    highPriorityCount: news.filter(item => item.priority >= 4).length
  }
}