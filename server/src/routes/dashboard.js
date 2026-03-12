const express = require('express');
const AttackLog = require('../models/AttackLog');
const Coupon = require('../models/Coupon');
const logger = require('../utils/logger');

const router = express.Router();

const buildAttackFilter = (since) => ({
  timestamp: { $gte: since },
  attackType: { $ne: 'UNKNOWN' }
});

const normalizeAttackType = (attackType) => (
  attackType === 'CREDENTIAL_STUFFING' ? 'BRUTE_FORCE' : attackType
);

// Get attack statistics
router.get('/stats', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const attackFilter = buildAttackFilter(since);
    
    const totalAttacks = await AttackLog.countDocuments(attackFilter);
    
    // Attack type distribution
    const attackTypes = await AttackLog.aggregate([
      { $match: attackFilter },
      {
        $project: {
          attackType: {
            $cond: [{ $eq: ['$attackType', 'CREDENTIAL_STUFFING'] }, 'BRUTE_FORCE', '$attackType']
          }
        }
      },
      { $group: { _id: '$attackType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Top attacking IPs
    const topIPs = await AttackLog.aggregate([
      { $match: attackFilter },
      { $group: { _id: '$ip', count: { $sum: 1 }, lastSeen: { $max: '$timestamp' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Geographic distribution
    const geoDistribution = await AttackLog.aggregate([
      { $match: { ...attackFilter, 'geoip.country': { $exists: true } } },
      { $group: { _id: '$geoip.country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Severity distribution
    const severityDist = await AttackLog.aggregate([
      { $match: attackFilter },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalAttacks,
      timeRange: `${hours} hours`,
      attackTypes: attackTypes.map(a => ({ type: normalizeAttackType(a._id), count: a.count })),
      topIPs: topIPs.map(ip => ({ ip: ip._id, count: ip.count, lastSeen: ip.lastSeen })),
      geoDistribution: geoDistribution.map(g => ({ country: g._id, count: g.count })),
      severityDistribution: severityDist.map(s => ({ severity: s._id, count: s.count }))
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get live attack feed
router.get('/feed', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const attacks = await AttackLog.find({ attackType: { $ne: 'UNKNOWN' } })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .select('timestamp ip method attackType endpoint payload severity geoip');
    
    res.json({
      attacks: attacks.map(attack => ({
        ...attack.toObject(),
        attackType: normalizeAttackType(attack.attackType)
      }))
    });
  } catch (error) {
    logger.error('Dashboard feed error:', error);
    res.status(500).json({ error: 'Failed to fetch attack feed' });
  }
});

// Get coupon abuse statistics
router.get('/coupon-abuse', async (req, res) => {
  try {
    const abusedCoupons = await Coupon.find({ usedCount: { $gt: 10 } })
      .sort({ usedCount: -1 });
    
    res.json({
      abusedCoupons: abusedCoupons.map(c => ({
        code: c.code,
        usedCount: c.usedCount,
        usageLimit: c.usageLimit
      }))
    });
  } catch (error) {
    logger.error('Coupon abuse stats error:', error);
    res.status(500).json({ error: 'Failed to fetch coupon abuse stats' });
  }
});

// Generate WAF rules
router.get('/waf-rules', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const attackFilter = buildAttackFilter(since);
    
    // Get top attacking IPs
    const topIPs = await AttackLog.aggregate([
      { $match: attackFilter },
      { $group: { _id: '$ip', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    // Generate ModSecurity rules
    const modSecurityRules = topIPs.map(ip => 
      `SecRule REMOTE_ADDR "@ipMatch ${ip._id}" "id:100${ip._id.split('.').join('')},phase:1,deny,status:403,msg:'Blocked IP from honeypot'"`
    ).join('\n');
    
    // Generate Nginx deny rules
    const nginxRules = topIPs.map(ip => `deny ${ip._id};`).join('\n');
    
    // Generate rate limiting rules
    const rateLimitRules = `
# Rate limiting based on attack patterns
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/m;
`;
    
    res.json({
      modSecurity: modSecurityRules,
      nginx: nginxRules,
      rateLimiting: rateLimitRules,
      blacklistedIPs: topIPs.map(ip => ip._id),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('WAF rules generation error:', error);
    res.status(500).json({ error: 'Failed to generate WAF rules' });
  }
});

module.exports = router;
