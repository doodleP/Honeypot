import { useState } from 'react'
import api from '../utils/api'
import './Coupons.css'

function Coupons() {
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('100')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const applyCoupon = async () => {
    try {
      // VULN #1 — BRUTE FORCE / NO RATE LIMITING
      // This endpoint has no rate limiting or lockout mechanism.
      // An attacker can send thousands of requests to guess valid coupon codes
      // automatically without any throttling or CAPTCHA stopping them.
      const response = await api.get(`/api/coupons/apply?code=${code}&amount=${amount}`)
      setResult(response.data)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid coupon')
      setResult(null)
    }
  }

  const listCoupons = async () => {
    try {
      // VULN #2 — INFORMATION DISCLOSURE
      // This endpoint is unauthenticated and returns ALL coupons in the system,
      // including their codes, discount values, and internal metadata.
      // Any visitor (or bot) can call this to get a full list of valid codes
      // without needing to brute force anything.
      const response = await api.get('/api/coupons/list')
      setResult(response.data)
      setError('')
    } catch (err) {
      setError('Failed to list coupons')
    }
  }

  return (
    <div className="coupons-page">
      <div className="container">

        <div className="coupons-header">
          <h1>Coupons & Discounts</h1>
          <p>Apply a discount code to your order</p>
        </div>

        <div className="coupons-layout">

          {/* ── FORM CARD ── */}
          <div className="coupon-card">
            <h2>Apply Coupon</h2>

            <div className="form-group">
              <label>Coupon Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter coupon code"
              />
            </div>

            <div className="form-group">
              <label>Purchase Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
              />
            </div>

            <div>
              <button onClick={applyCoupon} className="btn-apply">Apply Coupon</button>
              <button onClick={listCoupons} className="btn-list">List All Coupons</button>
            </div>

            {error && <div className="coupon-error">{error}</div>}

            {/* VULN #2 continued — raw JSON result rendered here, exposing all coupon data */}
            {result && (
              <div className="coupon-result">
                <h3>Response</h3>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* ── INFO PANEL ── */}
          <div className="coupon-info-panel">
            <h3>Current Offer</h3>
            <div className="info-row">
              <span>Code</span>
              <span>GLOW10</span>
            </div>
            <div className="info-row">
              <span>Discount</span>
              <span>10% Off</span>
            </div>
            <div className="info-row">
              <span>Valid Until</span>
              <span>28 March 2026</span>
            </div>
            <div className="info-row">
              <span>Min. Purchase</span>
              <span>$50.00</span>
            </div>
            <p className="info-note">
              Apply the code at checkout. One coupon per order. Terms and conditions apply.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Coupons