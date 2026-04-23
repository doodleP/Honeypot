import { useState, useEffect } from 'react'
import './Home.css'

const slides = [
  {
    image: '/images/beautyBanner.jpg',
    eyebrow: 'HoneyGlow Beauty',
    heading: 'Get',
    highlight: 'Glowing',
    subheading: 'This Season',
    sub: 'Indulge in luxurious skincare crafted for every complexion. Pamper your skin with the care it deserves.',
    discount: '10%',
    code: 'GLOW10',
  },
  {
    image: '/images/BeautyBanner2.jpg',
    eyebrow: 'New Arrivals',
    heading: 'Feel',
    highlight: 'Radiant',
    subheading: 'Every Day',
    sub: 'Explore our newest collection of premium beauty products curated just for you.',
    discount: '15%',
    code: 'GLOW15',
  },
  {
    image: '/images/BeautyBanner3.jpg',
    eyebrow: 'Limited Offer',
    heading: 'Luxury',
    highlight: 'Skincare',
    subheading: 'For Less',
    sub: 'For a limited time, enjoy exclusive deals on our most-loved skincare essentials.',
    discount: '20%',
    code: 'GLOW20',
  },
]

function Home() {
  const [current, setCurrent] = useState(0)
  const [toast, setToast] = useState(null)
  const [fading, setFading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')

  const products = [
    { id: 1, name: 'Glowing Serum', price: 49.99, image: '/images/Serum.jpg', tag: 'Bestseller', category: 'Serum' },
    { id: 2, name: 'Hydrating Mask', price: 29.99, image: '/images/Mask.jpg', tag: 'Skin Care', category: 'Mask' },
    { id: 3, name: 'Luxury Lipstick', price: 24.99, image: '/images/lipsticks.jpg', tag: 'Colour', category: 'Lipstick' },
    { id: 4, name: 'Mascara UpSwing', price: 19.99, image: '/images/Mascara.jpg', tag: 'Eyes', category: 'Mascara' },
    { id: 5, name: 'Anti-Aging Cream', price: 79.99, image: '/images/Anti Cream.jpg', tag: 'Premium', category: 'Cream' },
    { id: 6, name: 'Radiance Boost Serum', price: 44.99, image: '/images/RBSerum.jpg', tag: 'Daily Glow', category: 'Serum' },
    { id: 8, name: 'Dew Drop Night Mask', price: 34.99, image: '/images/NightMask.jpg', tag: 'Overnight Care', category: 'Mask' },
    { id: 10, name: 'Velvet Rose Lipstick', price: 21.99, image: '/images/VelvetLips.jpg', tag: 'Matte Finish', category: 'Lipstick' },
    { id: 12, name: 'Lash Lift Mascara', price: 18.49, image: '/images/LashLift.jpg', tag: 'Volume Boost', category: 'Mascara' },
    { id: 14, name: 'Moisture Restore Cream', price: 69.99, image: '/images/MoistureRestor.jpg', tag: 'Firming Care', category: 'Cream' },
    { id: 7, name: 'Vitamin C Dark Circle Serum', price: 54.99, image: '/images/DarkCircle.jpg', tag: 'Brightening', category: 'Serum' },
    { id: 9, name: 'Aqua Comfort Mask', price: 27.99, image: '/images/ComfortMask.jpg', tag: 'Moisture Lock', category: 'Mask' },
    { id: 11, name: 'Satin Nude Lipstick', price: 26.99, image: '/images/SatinNudeLips.jpg', tag: 'Creamy Wear', category: 'Lipstick' },
    { id: 13, name: 'Midnight Curl Mascara', price: 22.99, image: '/images/MidnightCurl.jpg', tag: 'Long Wear', category: 'Mascara' },
    { id: 15, name: 'Sleep Repair Night Cream', price: 84.99, image: '/images/SleepRepair.jpg', tag: 'Luxury Care', category: 'Cream' },
  ]

  const categories = ['All', ...new Set(products.map((product) => product.category))]

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory

    return matchesCategory
  })

  // Auto advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goTo((current + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [current])

  const goTo = (index) => {
    setFading(true)
    setTimeout(() => {
      setCurrent(index)
      setFading(false)
    }, 400)
  }

  const showToast = (name, type) => {
    setToast({ name, type })
    setTimeout(() => setToast(null), 2500)
  }

  const addToCart = (product) => {
    const existing = JSON.parse(localStorage.getItem('cart') || '[]')
    const found = existing.find(item => item.id === product.id)
    if (found) {
      found.quantity += 1
      showToast(product.name, 'updated')
    } else {
      existing.push({ ...product, quantity: 1 })
      showToast(product.name, 'added')
    }
    localStorage.setItem('cart', JSON.stringify(existing))
  }

  const slide = slides[current]

  return (
    <div className="home">

      {/* ── HERO CAROUSEL ── */}
      <div className="hero" style={{ backgroundImage: `url('${slide.image}')` }}>
        <div className="hero-bg" />

        <div className={`hero-content ${fading ? 'hero-content--fading' : ''}`}>
          <p className="hero-eyebrow">{slide.eyebrow}</p>
          <h1>
            {slide.heading} <span>{slide.highlight}</span><br />{slide.subheading}
          </h1>
          <p>{slide.sub}</p>
          <button className="btn-hero">Shop Collection</button>
        </div>

        {/* Discount badge changes with each slide */}
        <div className={`hero-badge ${fading ? 'hero-content--fading' : ''}`}>
          <p className="discount-label">Flat</p>
          <div className="discount">{slide.discount}</div>
          <p style={{ fontSize: '11px', letterSpacing: '1px', marginTop: '8px', color: 'rgba(250,245,239,0.6)' }}>
            Use Code
          </p>
          <span className="code-tag">{slide.code}</span>
        </div>

        {/* ── DOTS ONLY — no arrows ── */}
        <div className="carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === current ? 'carousel-dot--active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <div className="products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Products</h2>
            <div className="section-controls">
              <span className="section-subtitle">{filteredProducts.length} items</span>
              <label className="category-select-wrap" htmlFor="category-filter">
                Categories
                <select
                  id="category-filter"
                  className="category-select"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="products-grid">
            {filteredProducts.map(product => (
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

          {filteredProducts.length === 0 && (
            <p className="no-products-message">No products found for this category.</p>
          )}
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`cart-toast ${toast.type === 'updated' ? 'cart-toast--updated' : ''}`}>
          <span className="cart-toast-icon">{toast.type === 'updated' ? '↑' : '✓'}</span>
          <div>
            <p className="cart-toast-title">
              {toast.type === 'updated' ? 'Already in Cart! Qty Updated' : 'Added to Cart'}
            </p>
            <p className="cart-toast-sub">{toast.name}</p>
          </div>
        </div>
      )}

    </div>
  )
}

export default Home