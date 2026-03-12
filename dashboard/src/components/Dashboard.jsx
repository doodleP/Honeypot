import { useState, useEffect } from 'react'
import api from '../utils/api'
import AttackFeed from './AttackFeed'
import AttackStats from './AttackStats'
import TopIPs from './TopIPs'
import GeoMap from './GeoMap'
import CouponAbuse from './CouponAbuse'
import WAFRules from './WAFRules'
import './Dashboard.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats?hours=24')
      setStats(response.data)
      setLastUpdated(new Date().toLocaleTimeString())
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-bar" />
        <p className="dashboard-loading-text">HoneyGlow Intelligence</p>
        <p className="dashboard-loading-sub">Loading threat data...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="dashboard-header-left">
            <h1>HoneyGlow <span>Threat Intelligence</span></h1>
            <p>Real-time attack monitoring and analysis</p>
          </div>
          <div className="dashboard-header-right">
            <div className="live-indicator">
              <span className="live-dot" />
              Live — updates every 30s
            </div>
            {lastUpdated && (
              <div className="live-indicator" style={{ borderColor: 'rgba(201,169,122,0.15)', color: 'rgba(201,169,122,0.4)' }}>
                Last: {lastUpdated}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container">
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <AttackStats stats={stats} />
            <AttackFeed />
            <TopIPs stats={stats} />
            <CouponAbuse />
          </div>

          <div className="dashboard-sidebar">
            <GeoMap stats={stats} />
            <WAFRules />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard