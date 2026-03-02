import './Home.css'

function Home() {
  const products = [
    { id: 1, name: 'Glowing Serum', price: 49.99, image: '💎' },
    { id: 2, name: 'Hydrating Mask', price: 29.99, image: '✨' },
    { id: 3, name: 'Luxury Lipstick', price: 24.99, image: '💄' },
    { id: 4, name: 'Mascara Pro', price: 19.99, image: '👁️' },
    { id: 5, name: 'Anti-Aging Cream', price: 79.99, image: '🌟' }
  ]

  return (
    <div className="home">
      <div className="container">
        <div className="hero">
          <h1>Welcome to HoneyGlow</h1>
          <p>Discover your perfect beauty routine</p>
        </div>
        
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">{product.image}</div>
              <h3>{product.name}</h3>
              <p className="price">${product.price}</p>
              <button className="btn btn-primary">Add to Cart</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
