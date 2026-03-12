const mongoose = require('mongoose');

const attackLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  ip: { type: String, required: true, index: true },
  userAgent: { type: String },
  method: { type: String, required: true },
  endpoint: { type: String, required: true, index: true },
  headers: { type: Map, of: String },
  requestBody: { type: mongoose.Schema.Types.Mixed },
  queryParams: { type: mongoose.Schema.Types.Mixed },
  attackType: { 
    type: String, 
    enum: [
      'SQL_INJECTION',
      'XSS',
      'LFI',
      'BRUTE_FORCE',
      'CREDENTIAL_STUFFING',
      'BUSINESS_LOGIC_ABUSE',
      'PRIVILEGE_ESCALATION',
      'IDOR',
      'PRICE_TAMPERING',
      'COUPON_ABUSE',
      'UNKNOWN'
    ],
    required: true,
    index: true
  },
  payload: { type: String },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  geoip: {
    country: String,
    region: String,
    city: String,
    lat: Number,
    lon: Number
  },
  blocked: { type: Boolean, default: false },
  responseStatus: { type: Number }
}, {
  timestamps: true
});

// Indexes for efficient querying
attackLogSchema.index({ timestamp: -1 });
attackLogSchema.index({ ip: 1, timestamp: -1 });
attackLogSchema.index({ attackType: 1, timestamp: -1 });

module.exports = mongoose.model('AttackLog', attackLogSchema);
