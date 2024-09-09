// models/Department.js
const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  }],
  assignedProcesses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BpmnModel',
  }]
});

const DepartmentStructureSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  }]
});

const Department = mongoose.model('Department', DepartmentSchema);
const DepartmentStructure = mongoose.model('DepartmentStructure', DepartmentStructureSchema);

module.exports = { Department, DepartmentStructure };
