import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  const products = [
    { id: 1, name: 'Glowing Serum', price: 49.99, image: '/images/Serum.jpg', tag: 'Bestseller' },
    { id: 2, name: 'Hydrating Mask', price: 29.99, image: '/images/Mask.jpg', tag: 'Skin Care' },
    { id: 3, name: 'Luxury Lipstick', price: 24.99, image: '/images/lipsticks.jpg', tag: 'Colour' },
    { id: 4, name: 'Mascara UpSwing', price: 19.99, image: '/images/Mascara.jpg', tag: 'Eyes' },
    { id: 5, name: 'Anti-Aging Cream', price: 79.99, image: '/images/Anti Cream.jpg', tag: 'Premium' },
  ]

  const addToCart = (product) => {
    // Read existing cart from localStorage
    const existing = JSON.parse(localStorage.getItem('cart') || '[]')

    // If product already in cart, just increase quantity
    const found = existing.find(item => item.id === product.id)
    if (found) {
      found.quantity += 1
    } else {
      existing.push({ ...product, quantity: 1 })
    }

    localStorage.setItem('cart', JSON.stringify(existing))
  
  }

  return (
    <div className="home">

      {/* ── HERO BANNER ── */}
      <div className="hero">
        <div className="hero-bg" />

        <div className="hero-content">
          <p className="hero-eyebrow">HoneyGlow Beauty</p>
          <h1>Get <span>Glowing</span><br />This Season</h1>
          <p>Indulge in luxurious skincare crafted for every complexion. Pamper your skin with the care it deserves.</p>
          <button className="btn-hero">Shop Collection</button>
        </div>

        <div className="hero-badge">
          <p className="discount-label">Flat</p>
          <div className="discount">10%</div>
          <p style={{ fontSize: '11px', letterSpacing: '1px', marginTop: '8px', color: 'rgba(250,245,239,0.6)' }}>
            Use Code
          </p>
          <span className="code-tag">GLOW10</span>
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <div className="products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Products</h2>
            <span className="section-subtitle">{products.length} items</span>
          </div>

          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="product-card-body">
                  <p className="product-tag">{product.tag}</p>
                  <h3>{product.name}</h3>
                  <p className="price">${product.price.toFixed(2)}</p>
                  <button className="btn-cart" onClick={() => addToCart(product)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Home