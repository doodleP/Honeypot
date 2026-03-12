const geoip = require('geoip-lite');
const AttackLog = require('../models/AttackLog');
const logger = require('../utils/logger');

const attackLogger = async (req, res, next) => {
  // Capture original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Store response data
  let responseBody = null;
  
  // Override res.send
  res.send = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };
  
  // Override res.json
  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };
  
  // Log after response is sent
  res.on('finish', async () => {
    try {
      const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
      const geo = geoip.lookup(ip);
      const classification = req.attackClassification || null;
      
      const logData = {
        ip,
        userAgent: req.headers['user-agent'],
        method: req.method,
        endpoint: req.path,
        attackType: classification?.type || 'UNKNOWN',
        headers: Object.fromEntries(
          Object.entries(req.headers).filter(([key]) => 
            !key.toLowerCase().includes('authorization') && 
            !key.toLowerCase().includes('cookie')
          )
        ),
        requestBody: req.body,
        queryParams: req.query,
        payload: classification?.payload,
        severity: classification?.severity,
        responseStatus: res.statusCode,
        geoip: geo ? {
          country: geo.country,
          region: geo.region,
          city: geo.city,
          lat: geo.ll[0],
          lon: geo.ll[1]
        } : null
      };
      
      // Store in database (async, don't block response)
      AttackLog.create(logData).catch(err => {
        logger.error('Failed to log attack:', err);
      });
    } catch (error) {
      logger.error('Error in attack logger:', error);
    }
  });
  
  next();
};

module.exports = attackLogger;
