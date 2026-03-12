const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

// SQL Injection patterns
const SQLI_PATTERNS = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/i,
  /(?:'|%27|")\s*(?:OR|AND)\b[\s\S]*?(?:=|LIKE)\s*['"\w\d]/i,
  /(?:'|%27|")\s*(?:UNION|SELECT|DROP|INSERT|UPDATE|DELETE|ALTER|CREATE|EXEC)\b/i,
  /\b(?:OR|AND)\b\s+\d+\s*=\s*\d+/i,
  /(?:--|#|\/\*)\s*$/i,
  /\b(?:xp_|sp_)\w+/i
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

const BRUTE_FORCE_INDICATORS = {
  attemptsPerMinute: 5,
  distinctPasswords: 4,
  distinctEmails: 3,
  windowMs: 60 * 1000
};

const COUPON_ABUSE_INDICATORS = {
  attemptsPerWindow: 6,
  distinctCodes: 4,
  windowMs: 2 * 60 * 1000
};

const loginAttemptsByIp = new Map();
const couponAttemptsByIp = new Map();

const ATTACK_PRIORITY = {
  PRIVILEGE_ESCALATION: 100,
  LFI: 90,
  SQL_INJECTION: 80,
  XSS: 70,
  IDOR: 60,
  PRICE_TAMPERING: 50,
  COUPON_ABUSE: 40,
  BRUTE_FORCE: 30,
  UNKNOWN: 0
};

const getRequestIp = (req) => (
  req.ip ||
  req.connection?.remoteAddress ||
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  'unknown'
);

const buildSafeRegex = (pattern) => new RegExp(pattern.source, pattern.flags.replace(/g/g, ''));

const findMatchingPattern = (patterns, input) => {
  if (!input) {
    return null;
  }

  for (const pattern of patterns) {
    const safePattern = buildSafeRegex(pattern);
    if (safePattern.test(input)) {
      return safePattern;
    }
  }

  return null;
};

const pruneAttempts = (attempts, windowMs) => {
  const cutoff = Date.now() - windowMs;
  return attempts.filter((attempt) => attempt.timestamp >= cutoff);
};

const trackAttempts = (store, key, attempt, windowMs) => {
  const existingAttempts = pruneAttempts(store.get(key) || [], windowMs);
  existingAttempts.push({ ...attempt, timestamp: Date.now() });
  store.set(key, existingAttempts);
  return existingAttempts;
};

const extractAuthenticatedUser = (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const detectBruteForce = (req, ip) => {
  if (req.method !== 'POST' || req.path !== '/api/auth/login') {
    return null;
  }

  const email = String(req.body?.email || '').toLowerCase();
  const password = String(req.body?.password || '');
  const attempts = trackAttempts(
    loginAttemptsByIp,
    ip,
    { email, password },
    BRUTE_FORCE_INDICATORS.windowMs
  );

  const distinctEmails = new Set(attempts.map((attempt) => attempt.email).filter(Boolean)).size;
  const distinctPasswords = new Set(attempts.map((attempt) => attempt.password).filter(Boolean)).size;

  if (
    attempts.length >= BRUTE_FORCE_INDICATORS.attemptsPerMinute ||
    distinctEmails >= BRUTE_FORCE_INDICATORS.distinctEmails ||
    distinctPasswords >= BRUTE_FORCE_INDICATORS.distinctPasswords
  ) {
    return {
      type: 'BRUTE_FORCE',
      severity: 'HIGH',
      payload: `Rapid login attempts detected for ${email || 'unknown-account'} (${attempts.length} attempts in 60s)`
    };
  }

  return null;
};

const detectCouponAbuse = (req, ip) => {
  if (!req.path.includes('/coupons/apply') || !req.query.code) {
    return null;
  }

  const couponCode = String(req.query.code || '').toUpperCase();
  const suspiciousCodes = ['ADMIN', 'FREE', '100OFF', 'TEST'];
  const attempts = trackAttempts(
    couponAttemptsByIp,
    ip,
    { couponCode },
    COUPON_ABUSE_INDICATORS.windowMs
  );
  const distinctCodes = new Set(attempts.map((attempt) => attempt.couponCode).filter(Boolean)).size;

  if (suspiciousCodes.some(code => couponCode.includes(code))) {
    return {
      type: 'COUPON_ABUSE',
      severity: 'LOW',
      payload: `Suspicious coupon code: ${couponCode}`
    };
  }

  if (
    attempts.length >= COUPON_ABUSE_INDICATORS.attemptsPerWindow ||
    distinctCodes >= COUPON_ABUSE_INDICATORS.distinctCodes
  ) {
    return {
      type: 'COUPON_ABUSE',
      severity: 'MEDIUM',
      payload: `Coupon enumeration detected (${attempts.length} attempts, ${distinctCodes} distinct codes)`
    };
  }

  return null;
};

const selectPrimaryAttack = (attacks) => {
  if (!attacks.length) {
    return null;
  }

  return attacks
    .slice()
    .sort((left, right) => (ATTACK_PRIORITY[right.type] || 0) - (ATTACK_PRIORITY[left.type] || 0))[0];
};

const detectAttack = (req) => {
  const attacks = [];
  const allInput = JSON.stringify({ ...req.body, ...req.query, ...req.params });
  const ip = getRequestIp(req);
  const authenticatedUser = extractAuthenticatedUser(req);
  const sqlInjectionMatch = findMatchingPattern(SQLI_PATTERNS, allInput);
  const xssMatch = findMatchingPattern(XSS_PATTERNS, allInput);
  const lfiMatch = findMatchingPattern(LFI_PATTERNS, allInput);
  
  // SQL Injection detection
  if (sqlInjectionMatch) {
    attacks.push({
      type: 'SQL_INJECTION',
      severity: 'HIGH',
      payload: allInput.match(sqlInjectionMatch)?.[0]
    });
  }
  
  // XSS detection
  if (xssMatch) {
    attacks.push({
      type: 'XSS',
      severity: 'MEDIUM',
      payload: allInput.match(xssMatch)?.[0]
    });
  }
  
  // LFI detection
  if (lfiMatch) {
    attacks.push({
      type: 'LFI',
      severity: 'HIGH',
      payload: allInput.match(lfiMatch)?.[0]
    });
  }

  const bruteForceAttack = detectBruteForce(req, ip);
  if (bruteForceAttack) {
    attacks.push(bruteForceAttack);
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
  const couponAbuseAttack = detectCouponAbuse(req, ip);
  if (couponAbuseAttack) {
    attacks.push(couponAbuseAttack);
  }
  
  // Privilege escalation - accessing admin routes without admin role
  if (req.path.startsWith('/api/admin') && authenticatedUser?.role !== 'admin') {
    attacks.push({
      type: 'PRIVILEGE_ESCALATION',
      severity: 'CRITICAL',
      payload: `Unauthorized admin access attempt: ${req.path}`
    });
  }
  
  // IDOR - accessing other users' data
  if (req.path.includes('/users') && req.query.id && authenticatedUser?.userId && authenticatedUser.userId !== req.query.id) {
    attacks.push({
      type: 'IDOR',
      severity: 'HIGH',
      payload: `IDOR attempt: accessing user ${req.query.id}`
    });
  }
  
  return {
    primaryAttack: selectPrimaryAttack(attacks),
    matchedAttacks: attacks
  };
};

const attackDetector = async (req, res, next) => {
  const { primaryAttack, matchedAttacks } = detectAttack(req);
  
  if (primaryAttack) {
    const ip = getRequestIp(req);
    req.attackClassification = {
      ...primaryAttack,
      matchedTypes: matchedAttacks.map((attack) => attack.type)
    };
    logger.warn(`Attack detected: ${primaryAttack.type} from ${ip}`, req.attackClassification);
  }
  
  next();
};

module.exports = attackDetector;
