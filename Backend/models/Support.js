const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const supportSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  assignedCompanies: [{ type: Schema.Types.ObjectId, ref: 'Business' }]
});

// Hash the password before saving
supportSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Support = mongoose.model('Support', supportSchema);

module.exports = Support;
