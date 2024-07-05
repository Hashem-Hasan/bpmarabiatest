const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: String,
  subRoles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
  assignedProcesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BpmnModel', default: [] }] // New field for assigned processes
});

const companyStructureSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }]
});

const Role = mongoose.model('Role', roleSchema);
const CompanyStructure = mongoose.model('CompanyStructure', companyStructureSchema);

module.exports = { CompanyStructure, Role };
