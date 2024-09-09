const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Log schema to keep track of actions performed by admin or support
const logSchema = new Schema({
  action: { type: String, required: true }, // e.g., "Activated", "Deactivated"
  timestamp: { type: Date, default: Date.now }, // Time of the action
  performedBy: { type: String, required: true }, // Email of the admin or support who performed the action
  period: { type: String, required: false }, // Subscription period (e.g., "1 month", "3 months", "6 months", "1 year", "unlimited")
});

// Define the User schema
const userSchema = new Schema({
  fullName: { type: String, required: true },
  businessMail: { type: String, unique: true, required: true },
  companyName: { type: String, required: true },
  companySize: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  isActivated: { type: Boolean, default: false },
  activationExpires: { type: Date },
  logs: [logSchema], // Include logs in the User schema
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
