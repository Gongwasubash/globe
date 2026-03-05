import { useEffect, useState } from 'react'

export function DebugPanel() {
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error

    const addLog = (msg: string) => {
      setLogs(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`])
    }

    console.log = (...args) => {
      originalLog(...args)
      if (args[0]?.includes?.('Fetch') || args[0]?.includes?.('API') || args[0]?.includes?.('satellite') || args[0]?.includes?.('flight') || args[0]?.includes?.('earthquake') || args[0]?.includes?.('wildfire')) {
        addLog(String(args[0]))
      }
    }

    console.error = (...args) => {
      originalError(...args)
      if (args[0]?.includes?.('Failed') || args[0]?.includes?.('error')) {
        addLog(`ERROR: ${String(args[0])}`)
      }
    }

    return () => {
      console.log = originalLog
      console.error = originalError
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: '400px',
      maxHeight: '300px',
      backgroundColor: '#000000dd',
      color: '#00FF00',
      fontFamily: 'monospace',
      fontSize: '11px',
      padding: '10px',
      borderRadius: '4px',
      border: '1px solid #00FF00',
      overflowY: 'auto',
      zIndex: 999,
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>API Debug Log</div>
      {logs.map((log, i) => (
        <div key={i} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {log}
        </div>
      ))}
    </div>
  )
}
