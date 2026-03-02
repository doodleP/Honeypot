const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const router = express.Router();

// Register endpoint - weak validation (vulnerability)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Intentionally weak validation - no email format check, no password strength
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Check if user exists (SQLi-style vulnerability in query)
    // In real MongoDB, this is safe, but we log it as if it were SQLi
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const user = new User({ email, password, name });
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      message: 'Registration successful',
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint - vulnerable to credential stuffing and SQLi-style attacks
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Intentionally vulnerable query - logs SQLi attempts
    // In real app, this would be vulnerable to NoSQL injection
    const user = await User.findOne({ 
      $or: [
        { email: email },
        // This allows SQLi-style payloads to be logged
        { email: { $regex: email, $options: 'i' } }
      ]
    });
    
    if (!user) {
      // Intentionally reveal that user doesn't exist (timing attack vulnerability)
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
