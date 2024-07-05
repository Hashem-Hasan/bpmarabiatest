const mongoose = require('mongoose');
const { Schema } = mongoose;

const logSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userEmail: String,
  action: String,
  timestamp: { type: Date, default: Date.now }
});

const bpmnSchema = new Schema({
  name: String,
  xml: String,
  owners: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  assignedRoles: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Ensure creator is required
  logs: [logSchema],
  isVerified: { type: Boolean, default: false } // Add isVerified field
});

const BpmnModel = mongoose.model('BpmnModel', bpmnSchema);

module.exports = BpmnModel;
