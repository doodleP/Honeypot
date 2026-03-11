import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import './Cart.css'

const PRODUCT_TAGS = {
  1: 'Bestseller',
  2: 'Skin Care',
  3: 'Colour',
  4: 'Eyes',
  5: 'Premium',
}

function Cart() {
  // Read cart from localStorage instead of hardcoded state
  const [items, setItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  })
  const navigate = useNavigate()

  const updatePrice = (id, newPrice) => {
    // VULN #1 — CLIENT-SIDE PRICE MANIPULATION
    // Price lives in frontend state with no validation.
    // User can type any value (0.01, negative, etc.) and it gets accepted.
    const updated = items.map(item =>
      item.id === id ? { ...item, price: parseFloat(newPrice) } : item
    )
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const updateQuantity = (id, newQty) => {
    const qty = parseInt(newQty)
    if (qty < 1) return
    const updated = items.map(item =>
      item.id === id ? { ...item, quantity: qty } : item
    )
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (id) => {
    const updated = items.filter(item => item.id !== id)
    setItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const addToCart = async () => {
    try {
      for (const item of items) {
        await api.post('/api/cart/add', {
          productId: item.id,
          quantity: item.quantity,
          price: item.price // VULN #2 — CLIENT-CONTROLLED PRICE SENT TO BACKEND
          // The backend receives whatever price the user typed in the UI.
          // Backend should never trust this — it should look up the real price
          // from the database using productId instead. It doesn't, so an attacker
          // can buy any product for any price they want.
        })
      }
      alert('Cart updated!')
    } catch (err) {
      alert('Failed to update cart')
    }
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const getInitials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2)

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Add something beautiful to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <span className="item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="cart-layout">
        {/* ── ITEMS ── */}
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-thumb">
                {item.image
                  ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                  : getInitials(item.name)
                }
              </div>

              <div className="cart-item-info">
                <span className="cart-item-tag">{PRODUCT_TAGS[item.id] || item.tag || 'Product'}</span>
                <h3>{item.name}</h3>
                <span className="cart-item-qty">
                  Qty:&nbsp;
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, e.target.value)}
                    min="1"
                    style={{ width: '48px', padding: '2px 6px', border: '1px solid #ddd5c8', borderRadius: '2px', fontFamily: 'Jost, sans-serif' }}
                  />
                </span>
              </div>

              <div className="item-controls">
                <div className="price-field">
                  <label>Price $</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updatePrice(item.id, e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
                <span className="item-total">${(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => removeItem(item.id)} style={{
                  background: 'none', border: 'none', color: '#9e8977',
                  fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'Jost, sans-serif', marginTop: '6px'
                }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── SUMMARY ── */}
        <div className="cart-summary">
          <p className="summary-title">Order Summary</p>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>${total.toFixed(2)}</strong>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>

          <button onClick={addToCart} className="btn-update">Update Cart</button>
          <button onClick={() => navigate('/checkout')} className="btn-checkout">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
