import { useState } from 'react'
import api from '../utils/api'
import './WAFRules.css'

function WAFRules() {
  const [rules, setRules] = useState(null)
  const [loading, setLoading] = useState(false)

  const generateRules = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/dashboard/waf-rules?hours=24')
      setRules(response.data)
    } catch (error) {
      console.error('Failed to generate WAF rules:', error)
    }
    setLoading(false)
  }

  return (
    <div className="waf-rules">
      <h2>WAF Rule Generator</h2>
      <p className="waf-description">Generate defense rules based on detected attacks</p>

      <button
        onClick={generateRules}
        className="btn-generate"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Rules'}
      </button>

      {rules && (
        <div className="rules-output">
          <div className="rule-section">
            <h3>Nginx Deny Rules</h3>
            <pre>{rules.nginx}</pre>
          </div>

          <div className="rule-section">
            <h3>ModSecurity Rules</h3>
            <pre>{rules.modSecurity}</pre>
          </div>

          <div className="rule-section">
            <h3>Rate Limiting</h3>
            <pre>{rules.rateLimiting}</pre>
          </div>

          <div className="rule-section">
            <h3>Blacklisted IPs ({rules.blacklistedIPs.length})</h3>
            <pre>{rules.blacklistedIPs.join('\n')}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default WAFRules