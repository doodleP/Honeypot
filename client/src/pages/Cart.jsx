import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import './Cart.css'

function Cart() {
  const [items, setItems] = useState([
    { id: 1, name: 'Glowing Serum', price: 49.99, quantity: 1 }
  ])
  const navigate = useNavigate()

  const updatePrice = (id, newPrice) => {
    // VULNERABILITY: Allows price manipulation from frontend
    setItems(items.map(item => 
      item.id === id ? { ...item, price: parseFloat(newPrice) } : item
    ))
  }

  const addToCart = async () => {
    // VULNERABILITY: Sends manipulated price to backend
    const item = items[0]
    try {
      await api.post('/api/cart/add', {
        productId: item.id,
        quantity: item.quantity,
        price: item.price // VULNERABLE: Client-controlled price
      })
      alert('Item added to cart!')
    } catch (err) {
      alert('Failed to add item')
    }
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>
        <div className="cart-items">
          {items.map(item => (
            <div key={item.id} className="cart-item">
              <h3>{item.name}</h3>
              <div className="item-controls">
                <label>Price: $</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updatePrice(item.id, e.target.value)}
                  step="0.01"
                  min="0"
                />
                <span>Qty: {item.quantity}</span>
                <span className="item-total">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-summary">
          <h2>Total: ${total.toFixed(2)}</h2>
          <button onClick={addToCart} className="btn btn-primary">Update Cart</button>
          <button onClick={() => navigate('/checkout')} className="btn btn-primary">
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
