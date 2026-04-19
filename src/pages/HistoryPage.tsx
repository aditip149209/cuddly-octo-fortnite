import { useState, useEffect } from 'react'
import '../layouts/DashboardLayout.css'

interface HistoryItem {
  id: string
  filename: string
  model: string
  result: string
  date: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch API to hit FastAPI backend
    fetch('http://localhost:8000/api/history')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch history')
        return res.json()
      })
      .then((data: HistoryItem[]) => setHistory(data))
      .catch((err) => console.error('Error fetching history:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dashboard-page">
      <h1>Upload History</h1>
      <div className="history-table-container " style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', border: '1px solid #1e293b'}}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px 8px', color: '#94a3b8' }}>Date</th>
              <th style={{ padding: '12px 8px', color: '#94a3b8' }}>File</th>
              <th style={{ padding: '12px 8px', color: '#94a3b8' }}>Model</th>
              <th style={{ padding: '12px 8px', color: '#94a3b8' }}>Output Result</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} style={{ padding: '16px 8px', textAlign: 'center' }}>Loading...</td></tr>}
            {!loading && history.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '16px 8px' }}>{new Date(item.date).toLocaleDateString()}</td>
                <td style={{ padding: '16px 8px' }}>{item.filename}</td>
                <td style={{ padding: '16px 8px' }}>{item.model}</td>
                <td style={{ padding: '16px 8px', color: '#60a5fa' }}>{item.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && history.length === 0 && <p style={{ textAlign: 'center', margin: '30px 0', color: '#94a3b8' }}>No history found.</p>}
      </div>
    </div>
  )
}
