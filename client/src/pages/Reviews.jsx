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
      // VULNERABILITY: XSS payloads can be submitted here
      const response = await api.post('/api/reviews', {
        productId: 1,
        rating,
        comment, // VULNERABLE: No sanitization
        userName // VULNERABLE: No sanitization
      })
      setMessage('Review submitted: ' + JSON.stringify(response.data.review))
      setComment('')
      setUserName('')
    } catch (err) {
      setMessage('Failed to submit review')
    }
  }

  return (
    <div className="reviews-page">
      <div className="container">
        <h1>Product Reviews</h1>
        <div className="review-form card">
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
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
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
            <button type="submit" className="btn btn-primary">Submit Review</button>
          </form>
          {message && (
            <div className="review-message" dangerouslySetInnerHTML={{ __html: message }} />
          )}
        </div>
      </div>
    </div>
  )
}

export default Reviews
