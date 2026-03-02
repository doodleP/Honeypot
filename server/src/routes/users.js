const express = require('express');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

// Get user by ID - VULNERABLE to IDOR (Insecure Direct Object Reference)
router.get('/', async (req, res) => {
  try {
    const { id, search } = req.query;
    
    // VULNERABILITY: Reflected XSS in search parameter
    if (search) {
      // Intentionally reflect search term without sanitization
      logger.warn(`XSS attempt in search: ${search}`);
      return res.json({ 
        message: `Search results for: ${search}`,
        users: [],
        // VULNERABILITY: Reflected XSS - search term echoed back
        searchTerm: search
      });
    }
    
    // VULNERABILITY: IDOR - no authorization check
    // Allows accessing any user's data by ID
    if (id) {
      const user = await User.findById(id).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // VULNERABILITY: No check if requester owns this account
      logger.warn(`IDOR access: User ${id} accessed without authorization check`);
      
      return res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt
        }
      });
    }
    
    // List all users (vulnerability: information disclosure)
    const users = await User.find().select('-password').limit(100);
    res.json({ users });
  } catch (error) {
    logger.error('User query error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
