import { Link } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">HoneyGlow</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/reviews">Reviews</Link>
          <Link to="/coupons">Coupons</Link>
          <Link to="/login">Login</Link>
          <Link to="/admin">Admin</Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
