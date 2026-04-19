import { useState, useEffect, useMemo } from 'react'

interface ModelInfo {
  id: string
  label: string
  algorithm: string
  hyperparameters: string
  description: string
}

export default function ModelInfoPage() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [modelKey, setModelKey] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch API to hit FastAPI backend
    fetch('http://localhost:8000/api/models')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch models info')
        return res.json()
      })
      .then((data: ModelInfo[]) => {
        setModels(data)
        if (data.length > 0) {
          setModelKey(data[0].id)
        }
      })
      .catch((err) => console.error('Error fetching model info:', err))
      .finally(() => setLoading(false))
  }, [])

  const selectedModel = useMemo(() => models.find(m => m.id === modelKey), [models, modelKey])

  if (loading) {
    return <div className="dashboard-page"><h1>Model Information</h1><p>Loading...</p></div>
  }

  return (
    <div className="dashboard-page">
      <h1>Model Information</h1>
      
      <div style={{ background: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid #1e293b', maxWidth: '700px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          <label style={{ fontWeight: '600', color: '#cbd5e1' }}>Select a Model to view details</label>
          <select 
            value={modelKey} 
            onChange={(e) => setModelKey(e.target.value)}
            style={{
              background: '#020617', border: '1px solid #334155', borderRadius: '8px', 
              padding: '12px', color: '#f8fafc', cursor: 'pointer', fontSize: '1rem', width: '100%', maxWidth: '300px'
            }}
          >
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        {selectedModel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#020617', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h3 style={{ margin: '0 0 8px', color: '#93c5fd', fontSize: '0.9rem', textTransform: 'uppercase' }}>Algorithm</h3>
              <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '500', color: '#f8fafc' }}>{selectedModel.algorithm}</p>
            </div>

            <div style={{ background: '#020617', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h3 style={{ margin: '0 0 8px', color: '#93c5fd', fontSize: '0.9rem', textTransform: 'uppercase' }}>Hyperparameters</h3>
              <code style={{ background: '#1e293b', padding: '8px 12px', borderRadius: '6px', color: '#a78bfa', fontSize: '0.95rem', display: 'block', border: '1px solid #334155' }}>
                {selectedModel.hyperparameters}
              </code>
            </div>

            <div style={{ background: '#020617', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b' }}>
              <h3 style={{ margin: '0 0 8px', color: '#93c5fd', fontSize: '0.9rem', textTransform: 'uppercase' }}>Description</h3>
              <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.6' }}>{selectedModel.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
