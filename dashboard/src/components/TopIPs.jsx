import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import './TopIPs.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function TopIPs({ stats }) {
  if (!stats || !stats.topIPs || stats.topIPs.length === 0) {
    return (
      <div className="top-ips">
        <h2>Top Attacking IPs</h2>
        <div className="no-data">No IP data available</div>
      </div>
    )
  }

  const ipData = {
    labels: stats.topIPs.map(ip => ip.ip),
    datasets: [{
      label: 'Attack Count',
      data: stats.topIPs.map(ip => ip.count),
      backgroundColor: stats.topIPs.map((_, i) =>
        i % 2 === 0 ? 'rgba(224, 92, 92, 0.7)' : 'rgba(99, 132, 255, 0.7)'
      ),
      borderColor: stats.topIPs.map((_, i) =>
        i % 2 === 0 ? 'rgba(224, 92, 92, 0.9)' : 'rgba(99, 132, 255, 0.9)'
      ),
      borderWidth: 1,
      borderRadius: 2,
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0d1117',
        borderColor: 'rgba(99,132,255,0.3)',
        borderWidth: 1,
        titleColor: '#6384ff',
        bodyColor: 'rgba(180,195,255,0.7)',
        titleFont: { family: 'Courier New', size: 12 },
        bodyFont: { family: 'Jost', size: 12 },
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(180,195,255,0.35)',
          font: { family: 'Courier New', size: 10 },
        },
        grid: {
          color: 'rgba(99,132,255,0.06)',
        },
        border: { color: 'rgba(99,132,255,0.1)' }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(180,195,255,0.35)',
          font: { family: 'Jost', size: 10 },
        },
        grid: {
          color: 'rgba(99,132,255,0.06)',
        },
        border: { color: 'rgba(99,132,255,0.1)' }
      }
    }
  }

  return (
    <div className="top-ips">
      <h2>Top Attacking IPs</h2>

      <div className="chart-wrapper">
        <Bar data={ipData} options={chartOptions} />
      </div>

      <div className="ip-list">
        <table>
          <thead>
            <tr>
              <th>IP Address</th>
              <th>Attacks</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {stats.topIPs.map(ip => (
              <tr key={ip.ip}>
                <td><code>{ip.ip}</code></td>
                <td>{ip.count}</td>
                <td>{new Date(ip.lastSeen).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TopIPs