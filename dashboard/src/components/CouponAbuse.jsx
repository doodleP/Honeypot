import { useState, useEffect } from 'react'
import api from '../utils/api'
import './CouponAbuse.css'

function CouponAbuse() {
  const [abusedCoupons, setAbusedCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCouponAbuse()
    const interval = setInterval(fetchCouponAbuse, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchCouponAbuse = async () => {
    try {
      const response = await api.get('/api/dashboard/coupon-abuse')
      setAbusedCoupons(response.data.abusedCoupons)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch coupon abuse:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="coupon-abuse">
        <h2>Coupon Abuse Tracker</h2>
        <div className="no-abuse">Loading coupon abuse data...</div>
      </div>
    )
  }

  return (
    <div className="coupon-abuse">
      <h2>Coupon Abuse Tracker</h2>

      {abusedCoupons.length === 0 ? (
        <div className="no-abuse">No coupon abuse detected</div>
      ) : (
        <div className="abuse-list">
          {abusedCoupons.map(coupon => (
            <div key={coupon.code} className="abuse-item">
              <div className="abuse-code">{coupon.code}</div>
              <div className="abuse-stats">
                <span>Used <strong>{coupon.usedCount}</strong></span>
                {coupon.usageLimit && (
                  <span>Limit <strong>{coupon.usageLimit}</strong></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CouponAbuse