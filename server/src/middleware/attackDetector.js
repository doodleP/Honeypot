const AttackLog = require('../models/AttackLog');
const logger = require('../utils/logger');

// SQL Injection patterns
const SQLI_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /('|(\\')|;|--|#|\/\*|\*\/|xp_|sp_)/i,
  /(\bOR\b.*=.*)|(\bAND\b.*=.*)/i,
  /(\bOR\b.*1.*=.*1)|(\bAND\b.*1.*=.*1)/i,
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/i,
  /on\w+\s*=/i,
  /<iframe[^>]*>/gi,
  /<img[^>]*onerror/i,
  /<svg[^>]*onload/i,
  /alert\s*\(/i,
  /eval\s*\(/i,
  /expression\s*\(/i
];

// LFI patterns
const LFI_PATTERNS = [
  /\.\.\/|\.\.\\|\.\.%2F|\.\.%5C/i,
  /\/etc\/passwd|\/proc\/self|\/etc\/hosts/i,
  /file:\/\/|php:\/\/|data:\/\//i,
  /%2e%2e%2f|%2e%2e%5c/i
];

// Credential stuffing indicators
const CREDENTIAL_STUFFING_INDICATORS = {
  rapidRequests: 5, // requests per minute threshold
  failedLogins: 3 // consecutive failed logins
};

const detectAttack = (req) => {
  const attacks = [];
  const allInput = JSON.stringify({ ...req.body, ...req.query, ...req.params });
  
  // SQL Injection detection
  if (SQLI_PATTERNS.some(pattern => pattern.test(allInput))) {
    attacks.push({
      type: 'SQL_INJECTION',
      severity: 'HIGH',
      payload: allInput.match(new RegExp(SQLI_PATTERNS.find(p => p.test(allInput)).source, 'i'))?.[0]
    });
  }
  
  // XSS detection
  if (XSS_PATTERNS.some(pattern => pattern.test(allInput))) {
    attacks.push({
      type: 'XSS',
      severity: 'MEDIUM',
      payload: allInput.match(new RegExp(XSS_PATTERNS.find(p => p.test(allInput)).source, 'gi'))?.[0]
    });
  }
  
  // LFI detection
  if (LFI_PATTERNS.some(pattern => pattern.test(allInput))) {
    attacks.push({
      type: 'LFI',
      severity: 'HIGH',
      payload: allInput.match(new RegExp(LFI_PATTERNS.find(p => p.test(allInput)).source, 'i'))?.[0]
    });
  }
  
  // Business logic abuse - Price tampering
  if (req.path.includes('/cart') && req.body.price !== undefined) {
    attacks.push({
      type: 'PRICE_TAMPERING',
      severity: 'MEDIUM',
      payload: `Price manipulation attempt: ${req.body.price}`
    });
  }
  
  // Coupon abuse detection
  if (req.path.includes('/coupons') && req.query.code) {
    const suspiciousCodes = ['ADMIN', 'FREE', '100OFF', 'TEST'];
    if (suspiciousCodes.some(code => req.query.code.toUpperCase().includes(code))) {
      attacks.push({
        type: 'COUPON_ABUSE',
        severity: 'LOW',
        payload: `Suspicious coupon code: ${req.query.code}`
      });
    }
  }
  
  // Privilege escalation - accessing admin routes without admin role
  if (req.path.startsWith('/api/admin') && !req.user?.role === 'admin') {
    attacks.push({
      type: 'PRIVILEGE_ESCALATION',
      severity: 'CRITICAL',
      payload: `Unauthorized admin access attempt: ${req.path}`
    });
  }
  
  // IDOR - accessing other users' data
  if (req.path.includes('/users') && req.query.id && req.user?.id !== req.query.id) {
    attacks.push({
      type: 'IDOR',
      severity: 'HIGH',
      payload: `IDOR attempt: accessing user ${req.query.id}`
    });
  }
  
  return attacks;
};

const attackDetector = async (req, res, next) => {
  const attacks = detectAttack(req);
  
  if (attacks.length > 0) {
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    
    for (const attack of attacks) {
      logger.warn(`Attack detected: ${attack.type} from ${ip}`, attack);
      
      // Log to database
      try {
        await AttackLog.create({
          ip,
          userAgent: req.headers['user-agent'],
          method: req.method,
          endpoint: req.path,
          headers: req.headers,
          requestBody: req.body,
          queryParams: req.query,
          attackType: attack.type,
          payload: attack.payload,
          severity: attack.severity,
          responseStatus: res.statusCode
        });
      } catch (error) {
        logger.error('Failed to log detected attack:', error);
      }
    }
    
    // Don't block the request - let it through to collect more intelligence
    // In a real honeypot, you might want to delay responses or add fake data
  }
  
  next();
};

module.exports = attackDetector;
