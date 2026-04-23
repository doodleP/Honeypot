const geoip = require('geoip-lite');
const AttackLog = require('../models/AttackLog');
const logger = require('../utils/logger');

function parseCookieHeader(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};

  const out = {};
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

const attackLogger = async (req, res, next) => {
  // Log after response is sent
  res.on('finish', async () => {
    try {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = (typeof forwarded === 'string' && forwarded.split(',')[0].trim())
        || req.ip
        || req.connection?.remoteAddress
        || 'unknown';

      const geo = geoip.lookup(ip);
      const classification = req.attackClassification || null;

      const cookieHeader = req.headers?.cookie;
      const cookies = parseCookieHeader(cookieHeader);
      
      const logData = {
        ip,
        method: req.method,
        endpoint: req.path,
        routeParams: req.params,
        attackType: classification?.type || 'UNKNOWN',
        cookies,
        requestBody: req.body,
        requestBodyRaw: typeof req.rawBody === 'string' ? req.rawBody : undefined,
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
