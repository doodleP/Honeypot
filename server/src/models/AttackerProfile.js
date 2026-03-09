// server/src/models/AttackerProfile.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AttackerProfileSchema = new Schema({
  ip: { type: String, index: true },
  ipVersion: { type: String, enum: ['v4','v6'], default: 'v4' },
  userAgent: { type: String },
  fingerprints: { type: [String], default: [] }, // e.g., browser fingerprint hashes
  geo: {
    country: String,
    region: String,
    city: String,
    lat: Number,
    lon: Number
  },
  tags: { type: [String], default: [] },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  sessions: [{ type: Schema.Types.ObjectId, ref: 'AttackerSession' }],
  notes: { type: String }
}, { timestamps: true });

// Update lastSeen on new log
AttackerProfileSchema.methods.touch = function(date = new Date()){
  this.lastSeen = date;
  return this.save();
};

// Simple risk calculation example
AttackerProfileSchema.methods.recalculateRisk = function(){
  let score = 0;
  if (this.tags.includes('bot')) score += 30;
  if (this.tags.includes('credential-stuffing')) score += 40;
  if (this.sessions && this.sessions.length > 5) score += 10;
  this.riskScore = Math.min(100, score);
  return this.save();
};

AttackerProfileSchema.statics.findByIP = function(ip){
  return this.findOne({ ip });
};

module.exports = mongoose.model('AttackerProfile', AttackerProfileSchema);