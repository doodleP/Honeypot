import { useState } from 'react'
import api from '../utils/api'
import './Checkout.css'

function Checkout() {
  const [items] = useState([{ id: 1, name: 'Glowing Serum', price: 49.99, quantity: 1 }])
  const [total, setTotal] = useState(49.99)
  const [discount, setDiscount] = useState(0)
  const [couponCode, setCouponCode] = useState('')
  const [message, setMessage] = useState('')

  const handleCheckout = async () => {
    try {
      // VULNERABILITY: Sends client-controlled total and discount
      const response = await api.post('/api/checkout', {
        items,
        total: total, // VULNERABLE: Client-controlled
        discount: discount, // VULNERABLE: Can be negative
        couponCode
      })
      setMessage(`Order placed! Order ID: ${response.data.orderId}`)
    } catch (err) {
      setMessage('Checkout failed: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <div className="checkout-form">
          <div className="form-group">
            <label>Items Total</label>
            <input
              type="number"
              value={total}
              onChange={(e) => setTotal(parseFloat(e.target.value))}
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>Discount</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value))}
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>Coupon Code</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
            />
          </div>
          <div className="checkout-total">
            <h2>Final Total: ${(total - discount).toFixed(2)}</h2>
          </div>
          {message && <div className="message">{message}</div>}
          <button onClick={handleCheckout} className="btn btn-primary">
            Place Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default Checkout
