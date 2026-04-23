import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Navbar.css'

const getAccountDataFromToken = () => {
  const token = localStorage.getItem('token')

  if (!token) {
    return { isLoggedIn: false, initial: null, email: '' }
  }

  try {
    const payloadPart = token.split('.')[1] || ''
    const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const paddingLength = (4 - (normalizedPayload.length % 4)) % 4
    const paddedPayload = normalizedPayload + '='.repeat(paddingLength)
    const decodedPayload = JSON.parse(window.atob(paddedPayload))
    const email = decodedPayload?.email || ''
    const name = decodedPayload?.name || ''
    const initial = name?.charAt(0)?.toUpperCase() || email?.charAt(0)?.toUpperCase() || 'U'

    return { isLoggedIn: true, email, name, initial }
  } catch {
    return { isLoggedIn: true, initial: 'U', email: '' }
  }
}

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [accountData, setAccountData] = useState(getAccountDataFromToken)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const menuRef = useRef(null)
  const searchRef = useRef(null)
  const searchInputRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const syncAccountData = () => setAccountData(getAccountDataFromToken())
    syncAccountData()
    window.addEventListener('storage', syncAccountData)
    window.addEventListener('auth-changed', syncAccountData)
    return () => {
      window.removeEventListener('storage', syncAccountData)
      window.removeEventListener('auth-changed', syncAccountData)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
    setAccountData(getAccountDataFromToken())
  }, [location.pathname])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.dispatchEvent(new Event('auth-changed'))
    setIsMenuOpen(false)
    navigate('/login')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/?search=${encodeURIComponent(q)}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">HoneyGlow</Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/reviews">Reviews</Link>
          <Link to="/coupons">Coupons</Link>
          <Link to="/admin">Admin</Link>

          {/* Search pill */}
          <div className="search-container" ref={searchRef}>
            <div className={`search-pill ${searchOpen ? 'expanded' : ''}`}>
              <svg
                className="search-pill-icon"
                width="12" height="12" viewBox="0 0 15 15" fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>

              {!searchOpen ? (
                <button
                  type="button"
                  className="search-pill-trigger"
                  onClick={() => setSearchOpen(true)}
                >
                  Search
                </button>
              ) : (
                <form onSubmit={handleSearchSubmit} className="search-pill-form">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="search-pill-input"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  <button
                    type="button"
                    className="search-pill-close"
                    onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1 1L8 8M8 1L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="account-menu" ref={menuRef}>
            <button
              type="button"
              className={`account-avatar ${accountData.isLoggedIn ? 'logged-in' : 'logged-out'}`}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              title={accountData.email || 'Account'}
            >
              {accountData.isLoggedIn ? accountData.initial : '?'}
            </button>

            {isMenuOpen && (
              <div className="account-dropdown">
                {accountData.isLoggedIn ? (
                  <>
                    <div className="account-dropdown-header">
                      <span className="dropdown-avatar">{accountData.initial}</span>
                      <div className="dropdown-user-info">
                        {accountData.name && <span className="dropdown-name">{accountData.name}</span>}
                        <span className="dropdown-email">{accountData.email}</span>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>Profile Settings</Link>
                    <button type="button" onClick={handleLogout}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>Create Account</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar