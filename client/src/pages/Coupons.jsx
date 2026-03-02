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
      // VULNERABILITY: Allows brute force coupon attempts
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
      // VULNERABILITY: Information disclosure
      const response = await api.get('/api/coupons/list')
      setResult(response.data)
    } catch (err) {
      setError('Failed to list coupons')
    }
  }

  return (
    <div className="coupons-page">
      <div className="container">
        <h1>Coupons & Discounts</h1>
        <div className="coupon-section card">
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
          <button onClick={applyCoupon} className="btn btn-primary">Apply Coupon</button>
          <button onClick={listCoupons} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
            List All Coupons
          </button>
          {error && <div className="error">{error}</div>}
          {result && (
            <div className="coupon-result">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Coupons
