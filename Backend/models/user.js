const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  fullName: { type: String, required: true },
  businessMail: { type: String, unique: true, required: true },
  companyName: { type: String, required: true },
  companySize: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);