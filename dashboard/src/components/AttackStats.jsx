import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import './AttackStats.css'

ChartJS.register(ArcElement, Tooltip, Legend)

function AttackStats({ stats }) {
  if (!stats) return <div className="card">Loading stats...</div>

  const attackTypeData = {
    labels: stats.attackTypes.map(a => a.type),
    datasets: [{
      data: stats.attackTypes.map(a => a.count),
      backgroundColor: [
        '#ff6384',
        '#36a2eb',
        '#ffce56',
        '#4bc0c0',
        '#9966ff',
        '#ff9f40',
        '#ff6384',
        '#c9cbcf'
      ]
    }]
  }

  const severityColors = {
    'CRITICAL': '#ff0000',
    'HIGH': '#ff6b6b',
    'MEDIUM': '#ffd93d',
    'LOW': '#6bcf7f'
  }

  const severityData = {
    labels: stats.severityDistribution.map(s => s.severity),
    datasets: [{
      data: stats.severityDistribution.map(s => s.count),
      backgroundColor: stats.severityDistribution.map(s => severityColors[s.severity] || '#aaa')
    }]
  }

  return (
    <div className="attack-stats">
      <div className="card">
        <h2>Attack Statistics (Last {stats.timeRange})</h2>
        <div className="stats-overview">
          <div className="stat-box">
            <div className="stat-value">{stats.totalAttacks}</div>
            <div className="stat-label">Total Attacks</div>
          </div>
        </div>
        
        <div className="charts-row">
          <div className="chart-container">
            <h3>Attack Types</h3>
            <Doughnut data={attackTypeData} />
          </div>
          
          <div className="chart-container">
            <h3>Severity Distribution</h3>
            <Doughnut data={severityData} />
          </div>
        </div>
        
        <div className="attack-types-list">
          <h3>Attack Breakdown</h3>
          <ul>
            {stats.attackTypes.map(attack => (
              <li key={attack.type}>
                <span className="attack-type">{attack.type}</span>
                <span className="attack-count">{attack.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AttackStats
