const express = require('express');
const User = require('../models/User');
const AttackLog = require('../models/AttackLog');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware to check admin (but with vulnerability)
const checkAdmin = (req, res, next) => {
  try {
    // VULNERABILITY: Broken access control - checks token but doesn't verify role properly
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // In a real vulnerable app, this might not properly verify the role
    // For honeypot purposes, we'll allow some requests through to log privilege escalation attempts
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      // VULNERABILITY: Sometimes allows non-admin access (for logging)
      if (decoded.role !== 'admin') {
        logger.warn(`Privilege escalation attempt: User ${decoded.email} accessing admin endpoint`);
        // Still allow through to collect intelligence
      }
    } catch (error) {
      // VULNERABILITY: Some admin endpoints might be accessible without proper auth
      logger.warn(`Admin access without valid token: ${req.path}`);
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Admin users list
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users, count: users.length });
  } catch (error) {
    logger.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin export - VULNERABLE to LFI (Local File Inclusion)
router.get('/export', checkAdmin, (req, res) => {
  try {
    const { file, format } = req.query;
    
    // VULNERABILITY: LFI - allows file path manipulation
    if (file) {
      logger.warn(`LFI attempt: ${file}`);
      
      // Simulate file reading (in real app, this would be vulnerable)
      const allowedFiles = ['users.csv', 'orders.csv', 'reports.csv'];
      const requestedFile = file.replace(/\.\./g, ''); // Weak sanitization
      
      if (allowedFiles.includes(requestedFile)) {
        return res.json({ 
          message: `Exporting ${requestedFile}`,
          data: `Sample data from ${requestedFile}`
        });
      } else {
        // Log LFI attempt
        return res.status(400).json({ error: 'Invalid file' });
      }
    }
    
    res.json({ 
      message: 'Export endpoint - specify file parameter',
      example: '/api/admin/export?file=users.csv'
    });
  } catch (error) {
    logger.error('Admin export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Admin attack logs
router.get('/logs', checkAdmin, async (req, res) => {
  try {
    const { limit = 100, attackType, ip } = req.query;
    
    const query = {};
    if (attackType) query.attackType = attackType;
    if (ip) query.ip = ip;
    
    const logs = await AttackLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({ logs, count: logs.length });
  } catch (error) {
    logger.error('Admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
