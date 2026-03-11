import { useState } from 'react'
import api from '../utils/api'
import './Reviews.css'

function Reviews() {
  const [comment, setComment] = useState('')
  const [userName, setUserName] = useState('')
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // VULN #1 — STORED XSS
      // Both userName and comment are sent to the backend with zero sanitization.
      // An attacker can submit <script>alert(1)</script> or any JS payload
      // which gets stored in the DB and served back to other users.
      const response = await api.post('/api/reviews', {
        productId: 1,
        rating,
        comment,   // VULNERABLE: unsanitized user input
        userName   // VULNERABLE: unsanitized user input
      })

      // VULN #2 — REFLECTED XSS
      // The raw server response (which contains the unescaped comment/userName)
      // is injected directly into the DOM via dangerouslySetInnerHTML below.
      // If the backend echoes the input back, the script tag executes immediately.
      setMessage('Review submitted: ' + JSON.stringify(response.data.review))
      setComment('')
      setUserName('')
    } catch (err) {
      setMessage('Failed to submit review')
    }
  }

  // Star helper for display
  const stars = Array.from({ length: 5 }, (_, i) => i < rating)

  return (
    <div className="reviews-page">
      <div className="container">

        <div className="reviews-header">
          <h1>Product Reviews</h1>
          <p>Share your experience with the HoneyGlow community</p>
        </div>

        <div className="review-form">
          <h2>Write a Review</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Rating</label>
              <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))}>
                <option value={5}>5 Stars — Excellent</option>
                <option value={4}>4 Stars — Very Good</option>
                <option value={3}>3 Stars — Average</option>
                <option value={2}>2 Stars — Poor</option>
                <option value={1}>1 Star — Terrible</option>
              </select>
              <div className="star-display" style={{ marginTop: '10px' }}>
                {stars.map((filled, i) => (
                  <span key={i} className={`star ${filled ? 'filled' : ''}`}>★</span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review..."
                rows="5"
              />
            </div>

            <button type="submit" className="btn-submit-review">
              Submit Review
            </button>
          </form>

          {/* VULN #2 — dangerouslySetInnerHTML renders raw HTML from the server response.
              If the backend echoes back the unsanitized comment, any script tag executes here. */}
          {message && (
            <div className="review-message" dangerouslySetInnerHTML={{ __html: message }} />
          )}
        </div>

      </div>
    </div>
  )
}

export default Reviews
