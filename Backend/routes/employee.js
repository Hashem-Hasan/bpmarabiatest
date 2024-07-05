const express = require('express');
const Employee = require('../models/Employee');
const { Role, CompanyStructure } = require('../models/CompanyStructure');
const BpmnModel = require('../models/BpmnModel');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Create a new employee
router.post('/', authenticateToken, async (req, res) => {
  const { fullName, email, password, phoneNumber, hrId, isAdmin, ownedProcesses, role } = req.body;

  try {
    const newEmployee = new Employee({
      fullName,
      email,
      password,
      phoneNumber,
      hrId,
      isAdmin,
      ownedProcesses,
      company: req.user.userId, // Link employee to the company of the logged-in user
      role
    });

    await newEmployee.save();
    res.status(201).send({ message: 'Employee created successfully', newEmployee });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).send({ message: 'Error creating employee', error });
  }
});

// Get all employees of the logged-in user's company
router.get('/', authenticateToken, async (req, res) => {
  try {
    const employees = await Employee.find({ company: req.user.userId })
      .populate('ownedProcesses')
      .populate('role');
    res.status(200).send(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).send({ message: 'Error fetching employees', error });
  }
});

// Update an employee
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { fullName, email, password, phoneNumber, hrId, isAdmin, ownedProcesses, role } = req.body;

  try {
    const employee = await Employee.findOne({ _id: id, company: req.user.userId });
    if (!employee) {
      return res.status(404).send({ message: 'Employee not found' });
    }

    employee.fullName = fullName;
    employee.email = email;
    if (password) {
      employee.password = password; // This will be hashed in the pre-save hook
    }
    employee.phoneNumber = phoneNumber;
    employee.hrId = hrId;
    employee.isAdmin = isAdmin;
    employee.ownedProcesses = ownedProcesses;
    employee.role = role;

    await employee.save();
    res.status(200).send({ message: 'Employee updated successfully', employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).send({ message: 'Error updating employee', error });
  }
});

// Delete an employee
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await Employee.findOneAndDelete({ _id: id, company: req.user.userId });
    if (!employee) {
      return res.status(404).send({ message: 'Employee not found' });
    }

    res.status(200).send({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).send({ message: 'Error deleting employee', error });
  }
});

// Helper function to recursively populate subroles
const populateSubRoles = async (role) => {
  await Role.populate(role, { path: 'subRoles' });
  for (let subRole of role.subRoles) {
    await populateSubRoles(subRole);
  }
};

// Fetch all roles and subroles for the logged-in user's company
router.get('/roles', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const companyStructure = await CompanyStructure.findOne({ userId }).populate('roles');

    if (!companyStructure) {
      return res.status(404).send({ message: 'No company structure found for this user' });
    }

    for (let role of companyStructure.roles) {
      await populateSubRoles(role);
    }

    console.log("Fetched Roles:", JSON.stringify(companyStructure.roles, null, 2));
    res.status(200).send(companyStructure.roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).send({ message: 'Error fetching roles', error });
  }
});

module.exports = router;
