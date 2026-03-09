// server/src/models/AttackCampaign.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AttackCampaignSchema = new Schema({
  name: { type: String, required: true, index: true },
  description: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  attackers: [{ type: Schema.Types.ObjectId, ref: 'AttackerProfile' }],
  indicators: [{ type: String }], // e.g., payload hashes, IP ranges
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status: { type: String, enum: ['active','mitigated','closed'], default: 'active' },
  tags: { type: [String], default: [] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

AttackCampaignSchema.methods.addIndicator = function(indicator){
  if (!this.indicators.includes(indicator)) this.indicators.push(indicator);
  return this.save();
};

module.exports = mongoose.model('AttackCampaign', AttackCampaignSchema);