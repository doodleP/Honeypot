import { useState } from 'react'
import api from '../utils/api'
import './ReportGenerator.css'

function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)

  const generateReport = async () => {
    setIsGenerating(true)
    setError(null)
    setShowModal(true)
    setStatus('Fetching attack logs...')

    try {
      setStatus('Fetching attack logs and statistics...')
      
      // Call the report generation endpoint
      setStatus('Analyzing with AI...')
      const response = await api.post('/api/reports/generate', {}, {
        responseType: 'blob',
        timeout: 150000 // 2.5 minute timeout
      })

      setStatus('Generating PDF...')

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition']
      let filename = 'threat_intelligence_report.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) filename = filenameMatch[1]
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)

      setStatus('')
      setShowModal(false)
      showSuccessNotification(filename)
    } catch (err) {
      console.error('Report generation error:', err)
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to generate report. Please ensure Ollama is running.'
      )
      setStatus('')
    } finally {
      setIsGenerating(false)
    }
  }

  const showSuccessNotification = (filename) => {
    // Simple notification - you could enhance this with a toast library
    alert(`✓ Report generated successfully: ${filename}`)
  }

  const closeModal = () => {
    if (!isGenerating) {
      setShowModal(false)
      setError(null)
      setStatus('')
    }
  }

  return (
    <>
      <button 
        className="report-generator-btn"
        onClick={generateReport}
        disabled={isGenerating}
        title="Generate a comprehensive threat intelligence report in PDF format"
      >
        <span className="btn-icon">📄</span>
        Generate Report
      </button>

      {showModal && (
        <div className="report-modal-overlay" onClick={closeModal}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h2>Generating Threat Intelligence Report</h2>
              {!isGenerating && (
                <button className="close-btn" onClick={closeModal}>×</button>
              )}
            </div>

            <div className="report-modal-content">
              {isGenerating ? (
                <>
                  <div className="report-spinner" />
                  <p className="report-status">{status}</p>
                  <div className="progress-bar">
                    <div className="progress-fill" />
                  </div>
                  <p className="report-info">This may take a minute while Ollama analyzes the attack data...</p>
                </>
              ) : error ? (
                <>
                  <div className="error-icon">⚠️</div>
                  <p className="report-error">{error}</p>
                  <button className="close-btn-bottom" onClick={closeModal}>Close</button>
                </>
              ) : (
                <>
                  <div className="success-icon">✓</div>
                  <p className="report-success">Report generated successfully!</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ReportGenerator
