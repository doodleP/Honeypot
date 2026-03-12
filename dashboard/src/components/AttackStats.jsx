import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import './AttackStats.css'

ChartJS.register(ArcElement, Tooltip, Legend)

const chartOptions = {
  plugins: {
    legend: {
      labels: {
        color: 'rgba(180, 195, 255, 0.5)',
        font: { family: 'Jost', size: 11 },
        boxWidth: 10,
        padding: 12,
      }
    },
    tooltip: {
      backgroundColor: '#0d1117',
      borderColor: 'rgba(99,132,255,0.3)',
      borderWidth: 1,
      titleColor: '#6384ff',
      bodyColor: 'rgba(180,195,255,0.7)',
      titleFont: { family: 'Cormorant Garamond', size: 14 },
      bodyFont: { family: 'Jost', size: 12 },
    }
  }
}

function AttackStats({ stats }) {
  if (!stats) return (
    <div className="attack-stats">
      <div className="card">
        <h2>Attack Statistics</h2>
        <p style={{ color: 'rgba(180,195,255,0.3)', fontSize: '13px', fontFamily: 'Jost' }}>Loading stats...</p>
      </div>
    </div>
  )

  const attackTypeData = {
    labels: stats.attackTypes.map(a => a.type),
    datasets: [{
      data: stats.attackTypes.map(a => a.count),
      backgroundColor: [
        'rgba(224, 92, 92, 0.85)',
        'rgba(224, 92, 92, 0.6)',
        'rgba(99, 132, 255, 0.85)',
        'rgba(99, 132, 255, 0.65)',
        'rgba(99, 132, 255, 0.45)',
        'rgba(224, 92, 92, 0.4)',
        'rgba(99, 132, 255, 0.3)',
        'rgba(224, 92, 92, 0.3)',
      ],
      borderColor: '#0d1117',
      borderWidth: 2,
    }]
  }

  const severityColors = {
    'CRITICAL': 'rgba(224, 92, 92, 0.9)',
    'HIGH':     'rgba(224, 92, 92, 0.6)',
    'MEDIUM':   'rgba(99, 132, 255, 0.75)',
    'LOW':      'rgba(99, 132, 255, 0.45)',
  }

  const severityData = {
    labels: stats.severityDistribution.map(s => s.severity),
    datasets: [{
      data: stats.severityDistribution.map(s => s.count),
      backgroundColor: stats.severityDistribution.map(s => severityColors[s.severity] || 'rgba(99,132,255,0.3)'),
      borderColor: '#0d1117',
      borderWidth: 2,
    }]
  }

  const severityStatColors = {
    'CRITICAL': '#e05c5c',
    'HIGH':     '#e0845c',
    'MEDIUM':   '#6384ff',
    'LOW':      '#6384ff',
  }

  return (
    <div className="attack-stats">
      <div className="card">
        <h2>Attack Statistics — Last {stats.timeRange}</h2>

        <div className="stats-overview">
          <div className="stat-box">
            <div className="stat-value">{stats.totalAttacks}</div>
            <div className="stat-label">Total Attacks</div>
          </div>
          {stats.severityDistribution.map(s => (
            <div className="stat-box" key={s.severity}>
              <div className="stat-value" style={{ color: severityStatColors[s.severity] || '#e05c5c' }}>
                {s.count}
              </div>
              <div className="stat-label">{s.severity}</div>
            </div>
          ))}
        </div>

        <div className="charts-row">
          <div className="chart-container">
            <h3>Attack Types</h3>
            <Doughnut data={attackTypeData} options={chartOptions} />
          </div>

          <div className="chart-container">
            <h3>Severity Distribution</h3>
            <Doughnut data={severityData} options={chartOptions} />
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