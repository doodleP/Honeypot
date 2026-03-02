import { useState, useEffect } from 'react'
import api from '../utils/api'
import './Admin.css'

function Admin() {
  const [users, setUsers] = useState([])
  const [exportFile, setExportFile] = useState('users.csv')
  const [exportResult, setExportResult] = useState('')
  const [userId, setUserId] = useState('')
  const [userData, setUserData] = useState(null)

  const fetchUsers = async () => {
    try {
      // VULNERABILITY: Privilege escalation - may work without admin role
      const response = await api.get('/api/admin/users')
      setUsers(response.data.users)
    } catch (err) {
      alert('Failed to fetch users: ' + err.message)
    }
  }

  const exportData = async () => {
    try {
      // VULNERABILITY: LFI - file parameter manipulation
      const response = await api.get(`/api/admin/export?file=${exportFile}`)
      setExportResult(JSON.stringify(response.data, null, 2))
    } catch (err) {
      setExportResult('Export failed: ' + err.message)
    }
  }

  const fetchUser = async () => {
    try {
      // VULNERABILITY: IDOR - accessing other users' data
      const response = await api.get(`/api/users?id=${userId}`)
      setUserData(response.data.user)
    } catch (err) {
      alert('Failed to fetch user')
    }
  }

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Admin Panel</h1>
        
        <div className="admin-section card">
          <h2>User Management</h2>
          <button onClick={fetchUsers} className="btn btn-primary">Fetch All Users</button>
          {users.length > 0 && (
            <div className="users-list">
              <h3>Users ({users.length})</h3>
              <ul>
                {users.map(user => (
                  <li key={user._id}>{user.email} - {user.role}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="admin-section card">
          <h2>Data Export</h2>
          <div className="form-group">
            <label>File Name</label>
            <input
              type="text"
              value={exportFile}
              onChange={(e) => setExportFile(e.target.value)}
              placeholder="users.csv"
            />
          </div>
          <button onClick={exportData} className="btn btn-primary">Export</button>
          {exportResult && (
            <div className="export-result">
              <pre>{exportResult}</pre>
            </div>
          )}
        </div>

        <div className="admin-section card">
          <h2>User Lookup</h2>
          <div className="form-group">
            <label>User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
          <button onClick={fetchUser} className="btn btn-primary">Fetch User</button>
          {userData && (
            <div className="user-data">
              <pre>{JSON.stringify(userData, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin
