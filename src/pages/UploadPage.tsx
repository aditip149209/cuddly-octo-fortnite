import { useState, type FormEvent, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [model, setModel] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<{value: string, label: string}[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const authContext = useContext(AuthContext)

  useEffect(() => {
    // Fetch models here too, so the dropdown matches available backend models
    fetch('http://localhost:8000/api/models')
      .then(res => res.json())
      .then((data) => {
        const parsedModels = data.map((d: any) => ({ value: d.id, label: d.label }))
        setModels(parsedModels)
        if (parsedModels.length > 0) setModel(parsedModels[0].value)
      })
      .catch(err => console.error('Failed to fetch models for dropdown', err))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setResult(null)

    if (!file) {
      setErrorMsg('Please select an image file.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file type. Only images are allowed.')
      return
    }

    if (!authContext?.user?.uid) {
      setErrorMsg('You must be logged in to upload.')
      return
    }

    setLoading(true)

    // Using fetch API to hit FastAPI backend
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('model', model)
      formData.append('user_id', authContext.user.uid)

      const response = await fetch('http://localhost:8000/api/inference', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Inference request failed')
      }

      const data = await response.json()
      setResult(`Result for ${data.model}: ${data.result}`)
    } catch (error) {
      console.error('Error during inference:', error)
      setErrorMsg('Failed to run inference. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-page">
      <h1>Upload Image</h1>

      <div style={{ background: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid #1e293b', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#cbd5e1' }}>Select Image (Heatmap)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
              style={{
                background: '#020617', border: '1px solid #334155', borderRadius: '8px', 
                padding: '12px', color: '#f8fafc', cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', color: '#cbd5e1' }}>Select Model</label>
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              style={{
                background: '#020617', border: '1px solid #334155', borderRadius: '8px', 
                padding: '12px', color: '#f8fafc', cursor: 'pointer', fontSize: '1rem'
              }}
            >
              {models.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {errorMsg && <div style={{ color: '#ef4444' }}>{errorMsg}</div>}

          <button 
            type="submit" 
            disabled={!file || loading}
            style={{
              background: '#2563eb', color: '#fff', border: 'none', padding: '14px', 
              borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: loading || !file ? 'not-allowed' : 'pointer',
              marginTop: '10px', opacity: loading || !file ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : 'Run Inference'}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: '24px', padding: '20px', background: '#020617', border: '1px solid #047857', borderRadius: '12px', color: '#34d399' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Result</h3>
            <p style={{ margin: 0 }}>{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}
