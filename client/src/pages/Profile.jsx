import { useMemo, useState } from 'react'
import './Auth.css'

function Profile() {
  const profile = useMemo(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      return null
    }

    try {
      const payloadPart = token.split('.')[1]
      const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
      const decodedPayload = JSON.parse(window.atob(normalizedPayload))

      return {
        email: decodedPayload?.email || '',
        role: decodedPayload?.role || 'user'
      }
    } catch {
      return null
    }
  }, [])

  const [displayName, setDisplayName] = useState('')

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <h2>Profile Settings</h2>
          {!profile && <div className="auth-error">Please login to view your profile settings.</div>}

          {profile && (
            <>
              <div className="form-group">
                <label>Email</label>
                <input type="text" value={profile.email} readOnly />
              </div>

              <div className="form-group">
                <label>Role</label>
                <input type="text" value={profile.role} readOnly />
              </div>

              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Set display name"
                />
              </div>

              <button type="button" className="btn-auth">Save Settings</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
