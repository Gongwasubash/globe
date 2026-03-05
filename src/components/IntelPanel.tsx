import React, { useState, useEffect, useRef } from 'react'
import { Brain, AlertTriangle, TrendingUp, Clock, Target, Zap, Shield, Activity } from 'lucide-react'

interface IntelBrief {
  brief: string
  timestamp: string
  region: string
  eventCount: number
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  threatScore: number
  patterns: string[]
  hotspots: Array<{lat: number, lon: number, count: number, radius: number}>
  recommendations: string[]
}

interface IntelPanelProps {
  events: any[]
  region: string
  isVisible: boolean
}

export default function IntelPanel({ events, region, isVisible }: IntelPanelProps) {
  const [brief, setBrief] = useState<IntelBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (events.length > 0) {
      generateBrief()
    }
  }, [events, region])

  useEffect(() => {
    if (autoRefresh && events.length > 0) {
      intervalRef.current = setInterval(() => {
        generateBrief()
      }, 30000) // Refresh every 30 seconds
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, events.length])

  const generateBrief = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events, region, includePatterns: true })
      })
      
      if (response.ok) {
        const data = await response.json()
        setBrief(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to generate brief:', error)
    } finally {
      setLoading(false)
    }
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-400 border-red-500/50 bg-red-500/10'
      case 'HIGH': return 'text-orange-400 border-orange-500/50 bg-orange-500/10'
      case 'MEDIUM': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10'
      case 'LOW': return 'text-green-400 border-green-500/50 bg-green-500/10'
      default: return 'text-gray-400 border-gray-500/50 bg-gray-500/10'
    }
  }

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'HIGH': return <Shield className="w-4 h-4 text-orange-400" />
      case 'MEDIUM': return <Activity className="w-4 h-4 text-yellow-400" />
      case 'LOW': return <Target className="w-4 h-4 text-green-400" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 w-96 bg-black/95 border border-green-500/30 rounded-lg backdrop-blur-sm font-mono text-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-green-500/30 bg-green-500/5">
        <Brain className="w-5 h-5 text-green-400" />
        <span className="text-green-300 font-bold flex-1">AI INTELLIGENCE</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoRefresh 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
            }`}
          >
            {autoRefresh ? 'AUTO' : 'MANUAL'}
          </button>
          <button 
            onClick={generateBrief}
            disabled={loading}
            className="text-xs bg-blue-500/20 px-2 py-1 rounded hover:bg-blue-500/30 disabled:opacity-50 border border-blue-500/30 text-blue-300"
          >
            {loading ? 'ANALYZING...' : 'REFRESH'}
          </button>
        </div>
      </div>

      {brief && (
        <div className="max-h-[80vh] overflow-y-auto">
          {/* Threat Level Banner */}
          <div className={`p-3 border-b border-green-500/30 ${getThreatColor(brief.threatLevel)}`}>
            <div className="flex items-center gap-2 mb-2">
              {getThreatIcon(brief.threatLevel)}
              <span className="font-bold">THREAT LEVEL: {brief.threatLevel}</span>
              <div className="ml-auto flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span className="text-xs">{brief.threatScore}%</span>
              </div>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  brief.threatLevel === 'CRITICAL' ? 'bg-red-500' :
                  brief.threatLevel === 'HIGH' ? 'bg-orange-500' :
                  brief.threatLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${brief.threatScore}%` }}
              />
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-green-500/30">
            <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              <div className="text-xs text-blue-300">EVENTS</div>
              <div className="text-blue-400 font-bold">{brief.eventCount}</div>
            </div>
            
            <div className="bg-red-500/10 p-2 rounded border border-red-500/20 text-center">
              <Target className="w-4 h-4 mx-auto mb-1 text-red-400" />
              <div className="text-xs text-red-300">HOTSPOTS</div>
              <div className="text-red-400 font-bold">{brief.hotspots.length}</div>
            </div>

            <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20 text-center">
              <Activity className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <div className="text-xs text-purple-300">PATTERNS</div>
              <div className="text-purple-400 font-bold">{brief.patterns.length}</div>
            </div>
          </div>

          {/* Patterns */}
          {brief.patterns.length > 0 && (
            <div className="p-3 border-b border-green-500/30">
              <div className="text-green-300 font-bold mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                DETECTED PATTERNS
              </div>
              <div className="space-y-1">
                {brief.patterns.slice(0, 3).map((pattern, i) => (
                  <div key={i} className="text-xs text-green-400 bg-green-500/5 p-2 rounded border border-green-500/20">
                    • {pattern}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotspots */}
          {brief.hotspots.length > 0 && (
            <div className="p-3 border-b border-green-500/30">
              <div className="text-red-300 font-bold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                PRIORITY HOTSPOTS
              </div>
              <div className="space-y-1">
                {brief.hotspots.slice(0, 3).map((hotspot, i) => (
                  <div key={i} className="text-xs text-red-400 bg-red-500/5 p-2 rounded border border-red-500/20 flex justify-between">
                    <span>{hotspot.lat.toFixed(2)}, {hotspot.lon.toFixed(2)}</span>
                    <span className="text-red-300">{hotspot.count} events</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="p-3 border-b border-green-500/30">
            <div className="text-yellow-300 font-bold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              RECOMMENDATIONS
            </div>
            <div className="space-y-1">
              {brief.recommendations.slice(0, 3).map((rec, i) => (
                <div key={i} className="text-xs text-yellow-400 bg-yellow-500/5 p-2 rounded border border-yellow-500/20">
                  • {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Full Brief */}
          <div className="p-3">
            <div className="text-green-300 font-bold mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              FULL INTELLIGENCE BRIEF
            </div>
            <div className="bg-green-500/5 p-3 rounded border border-green-500/20 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-green-400">
                {brief.brief}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-2 text-xs text-green-500">
              <Clock className="w-3 h-3" />
              <span>LAST UPDATE: {lastUpdate.toLocaleTimeString()}</span>
              <span className="ml-auto">REGION: {brief.region.toUpperCase()}</span>
            </div>
          </div>
        </div>
      )}

      {!brief && !loading && (
        <div className="text-center text-green-500/60 py-8">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Waiting for data to analyze...</p>
          <p className="text-xs mt-1">AI Intelligence will activate when events are detected</p>
        </div>
      )}

      {loading && (
        <div className="text-center text-green-400 py-8">
          <div className="animate-spin w-8 h-8 border-2 border-green-500/30 border-t-green-400 rounded-full mx-auto mb-3" />
          <p className="text-sm">Analyzing threat patterns...</p>
          <p className="text-xs mt-1">Processing {events.length} events</p>
        </div>
      )}
    </div>
  )
}