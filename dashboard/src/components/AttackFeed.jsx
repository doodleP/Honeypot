import { useState, useEffect } from 'react'
import api from '../utils/api'
import './AttackFeed.css'

function AttackFeed() {
  const [attacks, setAttacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, 5000)
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

  // Returns CSS class based on severity instead of inline color
  const getSeverityClass = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'sev-critical'
      case 'HIGH':     return 'sev-high'
      case 'MEDIUM':   return 'sev-medium'
      case 'LOW':      return 'sev-low'
      default:         return 'sev-low'
    }
  }

  const getItemClass = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'feed-item severity-critical'
      case 'HIGH':     return 'feed-item severity-high'
      default:         return 'feed-item'
    }
  }

  if (loading) {
    return (
      <div className="attack-feed">
        <h2>Live Attack Feed</h2>
        <div className="no-attacks">Loading feed...</div>
      </div>
    )
  }

  return (
    <div className="attack-feed">
      <h2>Live Attack Feed</h2>

      <div className="feed-container">
        {attacks.length === 0 ? (
          <div className="no-attacks">No attacks detected yet</div>
        ) : (
          attacks.map(attack => (
            <div key={attack._id} className={getItemClass(attack.severity)}>
              <div className="feed-header">
                <span className="feed-timestamp">
                  {new Date(attack.timestamp).toLocaleTimeString()}
                </span>
                <span className={`feed-severity ${getSeverityClass(attack.severity)}`}>
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
                    {attack.geoip.city}, {attack.geoip.country}
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