import { Brain, AlertTriangle, Activity, Zap } from 'lucide-react'
import { RegionIntelligence } from '../hooks/useAIIntelligence'

interface IntelligencePanelProps {
  intelligence: RegionIntelligence | null
  isAnalyzing: boolean
  selectedEntity: any
  onAnalyzeRegion: () => void
  getEntityIntelligence: (entity: any) => any
}

export function IntelligencePanel({
  intelligence,
  isAnalyzing,
  selectedEntity,
  onAnalyzeRegion,
  getEntityIntelligence
}: IntelligencePanelProps) {
  const entityIntel = selectedEntity ? getEntityIntelligence(selectedEntity) : null

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500'
      case 'high': return 'text-orange-500'
      case 'medium': return 'text-yellow-500'
      default: return 'text-green-500'
    }
  }

  return (
    <div className="fixed top-4 right-4 w-80 bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 text-white font-mono text-sm">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-cyan-400" />
        <span className="text-cyan-400 font-bold">AI INTELLIGENCE</span>
        <button
          onClick={onAnalyzeRegion}
          disabled={isAnalyzing}
          className="ml-auto px-2 py-1 bg-cyan-600/20 border border-cyan-500/50 rounded text-xs hover:bg-cyan-600/30 disabled:opacity-50"
        >
          {isAnalyzing ? 'ANALYZING...' : 'ANALYZE'}
        </button>
      </div>

      {/* Regional Analysis */}
      {intelligence && (
        <div className="mb-4 p-3 bg-gray-900/50 rounded border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">THREAT LEVEL</span>
            <span className={`font-bold ${getThreatColor(intelligence.threatLevel.level)}`}>
              {intelligence.threatLevel.level.toUpperCase()}
            </span>
          </div>
          
          <div className="text-xs text-gray-300 mb-2">
            Score: {intelligence.threatLevel.score}/100
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div>Flights: {intelligence.activities.flights}</div>
            <div>Satellites: {intelligence.activities.satellites}</div>
            <div>Earthquakes: {intelligence.activities.earthquakes}</div>
            <div>Wildfires: {intelligence.activities.wildfires}</div>
          </div>

          {intelligence.alerts.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-500 text-xs">ALERTS</span>
              </div>
              {intelligence.alerts.map((alert, i) => (
                <div key={i} className="text-xs text-yellow-300 ml-4">
                  • {alert}
                </div>
              ))}
            </div>
          )}

          {intelligence.threatLevel.factors.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">THREAT FACTORS:</div>
              {intelligence.threatLevel.factors.map((factor, i) => (
                <div key={i} className="text-xs text-red-300 ml-2">
                  • {factor}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Entity Analysis */}
      {selectedEntity && entityIntel && (
        <div className="p-3 bg-blue-900/30 rounded border border-blue-500/50">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-xs">ENTITY ANALYSIS</span>
          </div>
          
          <div className="text-xs mb-2">
            <span className="text-gray-400">Target: </span>
            <span className="text-white">{selectedEntity.name || 'Unknown'}</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400 text-xs">Threat:</span>
            <span className={`text-xs font-bold ${getThreatColor(entityIntel.threat)}`}>
              {entityIntel.threat.toUpperCase()}
            </span>
          </div>

          {entityIntel.notes.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">NOTES:</div>
              {entityIntel.notes.map((note: string, i: number) => (
                <div key={i} className="text-xs text-gray-300 ml-2">
                  • {note}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status */}
      <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>AI ACTIVE</span>
        </div>
        <div>
          {intelligence ? 
            `Updated ${intelligence.timestamp.toLocaleTimeString()}` : 
            'No analysis'
          }
        </div>
      </div>
    </div>
  )
}