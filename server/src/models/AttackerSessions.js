// server/src/models/AttackerSession.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AttackerSessionSchema = new Schema({
  profile: { type: Schema.Types.ObjectId, ref: 'AttackerProfile', required: true, index: true },
  sessionId: { type: String, index: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  requestCount: { type: Number, default: 0 },
  payloadSignatures: [{ type: Schema.Types.ObjectId, ref: 'PayloadSignature' }],
  metadata: { type: Schema.Types.Mixed } // store headers, cookies, etc.
}, { timestamps: true });

AttackerSessionSchema.methods.incrementRequests = function(n = 1){
  this.requestCount += n;
  return this.save();
};

AttackerSessionSchema.statics.open = async function(profileId, sessionId, metadata = {}){
  return this.create({ profile: profileId, sessionId, metadata });
};

module.exports = mongoose.model('AttackerSession', AttackerSessionSchema);