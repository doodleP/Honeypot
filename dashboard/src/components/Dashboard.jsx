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

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats?hours=24')
      setStats(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="dashboard-loading">Loading threat intelligence...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <h1>🍯 HoneyGlow Threat Intelligence Dashboard</h1>
          <p>Real-time attack monitoring and analysis</p>
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
