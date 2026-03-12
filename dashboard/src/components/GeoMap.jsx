import './GeoMap.css'

function GeoMap({ stats }) {
  if (!stats || !stats.geoDistribution || stats.geoDistribution.length === 0) {
    return (
      <div className="geo-map">
        <h2>Geographic Distribution</h2>
        <div className="no-geo-data">No geographic data available</div>
      </div>
    )
  }

  const max = stats.geoDistribution[0]?.count || 1

  return (
    <div className="geo-map">
      <h2>Geographic Distribution</h2>
      <div className="geo-list">
        {stats.geoDistribution.map((geo, i) => (
          <div key={geo.country} className="geo-item">
            <div className="geo-country">{geo.country || 'Unknown'}</div>
            <div className="geo-bar">
              <div
                className="geo-bar-fill"
                style={{ width: `${(geo.count / max) * 100}%` }}
              />
            </div>
            <div className="geo-count">{geo.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GeoMap