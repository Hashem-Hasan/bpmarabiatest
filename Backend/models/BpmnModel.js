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
  department: { type: Schema.Types.ObjectId, ref: 'Department', },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  logs: [logSchema],
  isVerified: { type: Boolean, default: false },
  version: { type: String, default: 'V0' }  // Add version field with default 'V0'
});

// Method to increment version
bpmnSchema.methods.incrementVersion = function() {
  // Extract the current version number and increment it
  const currentVersionNumber = parseInt(this.version.slice(1)) || 0; // Remove 'V' and parse number
  this.version = `V${currentVersionNumber + 1}`;  // Update the version
};

// Middleware to update the version after verification
bpmnSchema.pre('save', function(next) {
  if (this.isModified('isVerified') && this.isVerified) {  // Check if verification status changed to true
    this.incrementVersion();  // Increment version
  }
  next();
});

const BpmnModel = mongoose.model('BpmnModel', bpmnSchema);

module.exports = BpmnModel;
