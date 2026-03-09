// server/src/models/PayloadSignature.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PayloadSignatureSchema = new Schema({
  hash: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['sql-injection','xss','rce','lfi','sqli-blind','other'], default: 'other' },
  vector: { type: String }, // e.g., parameter name or header
  sample: { type: String }, // small sample of payload (careful with storage)
  detectedBy: { type: String }, // e.g., 'WAF', 'heuristic', 'manual'
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  occurrences: { type: Number, default: 1 },
  lastSeen: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

// increment occurrences and update lastSeen
PayloadSignatureSchema.statics.record = async function({ hash, type, vector, sample, detectedBy, severity }){
  const update = {
    $set: { type, vector, sample, detectedBy, severity, lastSeen: new Date() },
    $inc: { occurrences: 1 }
  };
  return this.findOneAndUpdate({ hash }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
};

module.exports = mongoose.model('PayloadSignature', PayloadSignatureSchema);