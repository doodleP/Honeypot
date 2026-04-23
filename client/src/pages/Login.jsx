import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import './Auth.css'

function Login() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      // Intentionally weak client-side validation for honeypot attack simulation.
      const endpoint = isCreatingAccount ? '/api/auth/register' : '/api/auth/login'
      const payload = isCreatingAccount
        ? { email, password, name }
        : { email, password }

      const response = await api.post(endpoint, payload)
      localStorage.setItem('token', response.data.token)
      window.dispatchEvent(new Event('auth-changed'))
      navigate('/')
    } catch (err) {
      const message = err.response?.data?.error

      if (isCreatingAccount && message === 'User already exists') {
        setError('Account already exists. Switch to login and continue.')
        return
      }

      setError(message || (isCreatingAccount ? 'Registration failed' : 'Login failed'))
    }
  }

  const toggleMode = () => {
    setError('')
    setIsCreatingAccount((prev) => !prev)
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h2>{isCreatingAccount ? 'Create Account' : 'Login to HoneyGlow'}</h2>
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            {isCreatingAccount && (
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            <button type="submit" className="btn-auth">
              {isCreatingAccount ? 'Create Account & Login' : 'Login'}
            </button>
          </form>
          <p className="auth-link">
            {isCreatingAccount ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="auth-toggle-btn"
            >
              {isCreatingAccount ? 'Login here' : 'Create one here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
