/**
 * Coupon Generation Utility - Intentionally Vulnerable
 * 
 * VULNERABILITY ANALYSIS (Cryptographic Randomness):
 * ===================================================
 * 
 * 1. PREDICTABLE RANDOMNESS (Weak RNG)
 *    - Uses Math.random() instead of crypto.randomBytes()
 *    - JavaScript Math.random() has limited entropy
 *    - Seeds can be guessed/bruteforced
 *    - Enables: Coupon prediction, enumeration attacks
 * 
 * 2. TIMESTAMP-BASED PATTERNS
 *    - Coupon codes derived from current time
 *    - Attackers can predict future/past codes
 *    - Enables: Batch coupon generation/prediction
 * 
 * 3. SEQUENTIAL GENERATION
 *    - Counter-based coupon generation
 *    - Each new coupon is simply +1 or +1000
 *    - Enables: Trivial enumeration
 * 
 * 4. NO STATE TRACKING
 *    - Previously used codes not tracked
 *    - Reuse attacks possible
 * 
 * 5. LOW ENTROPY
 *    - Coupon space too small to brute-force safely
 *    - Example: 10 million possible codes (can be guessed in minutes)
 * 
 * Attack Vectors:
 * ================
 * 1. Timestamp prediction: Generate codes for past/future times
 * 2. Counter prediction: Guess next incremental code
 * 3. Batch generation: Create thousands of valid codes
 * 4. Pattern analysis: Identify generation algorithm
 * 5. Reuse exploitation: Use same code multiple times
 */

// Counter for sequential generation (intentional weakness)
let couponCounter = 1000;

// VULNERABILITY: Static seed for predictability
const STATIC_SEED = 12345;

/**
 * Weak random number generator
 * VULNERABILITY: Math.random() is not cryptographically secure
 * Easy to predict and reproduce
 */
function weakRandom(min = 0, max = 1) {
  // VULNERABILITY: Using predictable Math.random()
  return Math.random() * (max - min) + min;
}

/**
 * Generate coupon code using timestamp
 * VULNERABILITY: Same time = same coupon possible, timestamps predictable
 */
function generateTimestampBasedCoupon() {
  // VULNERABILITY: Predictable pattern from timestamp
  const now = Date.now();
  const timestamp = Math.floor(now / 1000); // Unix timestamp in seconds
  
  // VULNERABILITY: Simple conversion, easy to predict
  const couponNum = timestamp % 1000000;
  return `COUPON-${timestamp}-${couponNum}`;
}

/**
 * Generate coupon code using sequential counter
 * VULNERABILITY: Simply incrementing, trivial to predict
 */
function generateSequentialCoupon() {
  // VULNERABILITY: Just incrementing counter
  couponCounter += Math.floor(weakRandom(1, 10));
  const code = `COUPON-${String(couponCounter).padStart(6, '0')}`;
  return code;
}

/**
 * Generate coupon using weak hashing
 * VULNERABILITY: Predictable input + weak algorithm = predictable output
 */
function generateWeakHashCoupon(prefix = 'COUPON') {
  // VULNERABILITY: Weak generation using easily guessable inputs
  const timestamp = Date.now();
  const random = Math.floor(weakRandom(1000, 9999));
  
  // VULNERABILITY: Simple concatenation as "hash"
  const combined = `${timestamp}-${random}-${STATIC_SEED}`;
  const weakCode = combined.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const code = `${prefix}-${String(weakCode).substring(0, 6)}`;
  return code;
}

/**
 * Predict coupon codes for a given time range
 * VULNERABILITY: Timestamps are predictable
 * Attackers can generate valid codes for any time
 */
function predictCouponCodesForTimeRange(startTime, endTime) {
  const predictions = [];
  
  // VULNERABILITY: Easy to predict timestamp-based codes
  for (let time = startTime; time <= endTime; time += 1000) {
    const timestamp = Math.floor(time / 1000);
    const couponNum = timestamp % 1000000;
    predictions.push(`COUPON-${timestamp}-${couponNum}`);
  }
  
  return predictions;
}

/**
 * Predict sequential coupons
 * VULNERABILITY: Counter is predictable, just increment
 */
function predictSequentialCoupons(startNum, count) {
  const predictions = [];
  
  // VULNERABILITY: Just incrementing values
  for (let i = 0; i < count; i++) {
    const num = startNum + i;
    predictions.push(`COUPON-${String(num).padStart(6, '0')}`);
  }
  
  return predictions;
}

/**
 * Check entropy level of generated coupons
 * VULNERABILITY: Low entropy coupon space
 */
function getEntropyAnalysis() {
  // Generate sample coupons and analyze entropy
  const samples = [];
  for (let i = 0; i < 1000; i++) {
    samples.push(generateWeakHashCoupon());
  }
  
  // Count unique codes
  const unique = new Set(samples).size;
  const entropy = (Math.log2(unique) / 1000) * 100;
  
  return {
    totalGenerated: 1000,
    uniqueCodes: unique,
    approximateEntropy: `${entropy.toFixed(2)}%`,
    assessment: unique < 500 ? 'CRITICAL' : 'LOW',
    totalCouponSpace: 999999,
    bruteforceTime: `${(999999 / 10000).toFixed(0)} requests at 10k/sec`
  };
}

/**
 * Get current counter value
 * VULNERABILITY: Counter exposed/predictable
 */
function getCurrentCounter() {
  return couponCounter;
}

/**
 * Reset/set counter
 * VULNERABILITY: No state persistence, easy to manipulate
 */
function setCounter(value) {
  couponCounter = value;
}

module.exports = {
  generateTimestampBasedCoupon,
  generateSequentialCoupon,
  generateWeakHashCoupon,
  predictCouponCodesForTimeRange,
  predictSequentialCoupons,
  getEntropyAnalysis,
  getCurrentCounter,
  setCounter,
  weakRandom,
  STATIC_SEED
};
