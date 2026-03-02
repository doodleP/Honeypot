import { useState, useEffect } from 'react'
import api from '../utils/api'
import './AttackFeed.css'

function AttackFeed() {
  const [attacks, setAttacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchFeed = async () => {
    try {
      const response = await api.get('/api/dashboard/feed?limit=20')
      setAttacks(response.data.attacks)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch feed:', error)
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#ff0000'
      case 'HIGH': return '#ff6b6b'
      case 'MEDIUM': return '#ffd93d'
      case 'LOW': return '#6bcf7f'
      default: return '#aaa'
    }
  }

  if (loading) {
    return <div className="card">Loading attack feed...</div>
  }

  return (
    <div className="attack-feed card">
      <h2>Live Attack Feed</h2>
      <div className="feed-container">
        {attacks.length === 0 ? (
          <div className="no-attacks">No attacks detected yet</div>
        ) : (
          attacks.map(attack => (
            <div key={attack._id} className="feed-item">
              <div className="feed-header">
                <span className="feed-timestamp">
                  {new Date(attack.timestamp).toLocaleTimeString()}
                </span>
                <span 
                  className="feed-severity"
                  style={{ backgroundColor: getSeverityColor(attack.severity) }}
                >
                  {attack.severity}
                </span>
              </div>
              <div className="feed-body">
                <div className="feed-type">{attack.attackType}</div>
                <div className="feed-ip">{attack.ip}</div>
                <div className="feed-endpoint">{attack.method} {attack.endpoint}</div>
                {attack.payload && (
                  <div className="feed-payload">
                    <code>{attack.payload.substring(0, 100)}</code>
                  </div>
                )}
                {attack.geoip && (
                  <div className="feed-geo">
                    📍 {attack.geoip.city}, {attack.geoip.country}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AttackFeed
