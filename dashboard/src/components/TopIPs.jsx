import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import './TopIPs.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function TopIPs({ stats }) {
  if (!stats || !stats.topIPs || stats.topIPs.length === 0) {
    return <div className="card">No IP data available</div>
  }

  const ipData = {
    labels: stats.topIPs.map(ip => ip.ip),
    datasets: [{
      label: 'Attack Count',
      data: stats.topIPs.map(ip => ip.count),
      backgroundColor: '#ff6b9d'
    }]
  }

  return (
    <div className="top-ips card">
      <h2>Top Attacking IPs</h2>
      <div className="chart-wrapper">
        <Bar data={ipData} options={{
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }} />
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
