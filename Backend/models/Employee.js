// models/Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  hrId: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  ownedProcesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BpmnModel' }],
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
});

employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Check if the password is already hashed
  const isHashed = this.password.startsWith('$2b$');
  if (isHashed) {
    return next();
  }

  // Hash the password only if it is not hashed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
