const express = require('express');
const logger = require('../utils/logger');

const router = express.Router();

// Submit review - VULNERABLE to XSS
router.post('/', (req, res) => {
  try {
    const { productId, rating, comment, userName } = req.body;
    
    // VULNERABILITY: XSS - stores and returns user input without sanitization
    const review = {
      id: Date.now(),
      productId,
      rating: parseInt(rating) || 5,
      comment: comment || '', // VULNERABLE: No sanitization
      userName: userName || 'Anonymous', // VULNERABLE: No sanitization
      timestamp: new Date().toISOString()
    };
    
    logger.warn(`Review submitted - Potential XSS in comment: ${comment}`);
    
    // Intentionally return unsanitized data
    res.json({ 
      message: 'Review submitted successfully',
      review: review // VULNERABILITY: XSS payload returned
    });
  } catch (error) {
    logger.error('Review submission error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Get reviews - reflects XSS payloads
router.get('/', (req, res) => {
  try {
    const { productId } = req.query;
    
    // VULNERABILITY: Reflected XSS in productId parameter
    if (productId) {
      logger.warn(`XSS attempt in productId: ${productId}`);
    }
    
    res.json({ 
      reviews: [],
      productId: productId || null, // VULNERABILITY: Reflected XSS
      message: 'Reviews retrieved'
    });
  } catch (error) {
    logger.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

module.exports = router;
