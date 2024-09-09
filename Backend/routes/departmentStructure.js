// routes/departmentStructure.js
const express = require('express');
const { Department, DepartmentStructure } = require('../models/Department');
const BpmnModel = require('../models/BpmnModel');
const Employee = require('../models/Employee'); // Import Employee model
const authenticateToken = require('../middleware/authenticateToken'); // For main users
const authenticateEmployeeToken = require('../middleware/authenticateEmployeeToken'); // For employees
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY || 'your_secret_key_here';

const router = express.Router();

// Add department
router.post('/add-department', authenticateToken, async (req, res) => {
  const { parentId, name } = req.body;
  const userId = req.user.userId;

  try {
    const newDepartment = new Department({ name, subDepartments: [] });
    await newDepartment.save();

    if (parentId) {
      const parentDepartment = await Department.findById(parentId);
      if (!parentDepartment) {
        throw new Error('Parent department not found');
      }
      parentDepartment.subDepartments.push(newDepartment._id);
      await parentDepartment.save();
    } else {
      let departmentStructure = await DepartmentStructure.findOne({ userId });
      if (!departmentStructure) {
        departmentStructure = new DepartmentStructure({ userId, departments: [] });
      }
      departmentStructure.departments.push(newDepartment._id);
      await departmentStructure.save();
    }

    res.status(201).send({ message: 'Department added successfully', newDepartment });
  } catch (error) {
    console.error('Error adding department:', error);
    res.status(500).send({ message: 'Error adding department', error });
  }
});

// Assign processes to department
router.put('/assign-processes', authenticateToken, async (req, res) => {
  const { departmentId, processIds } = req.body;

  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).send({ message: 'Department not found' });
    }

    department.assignedProcesses = [...new Set([...department.assignedProcesses, ...processIds])];
    await department.save();

    await BpmnModel.updateMany(
      { _id: { $in: processIds } },
      { $addToSet: { assignedDepartments: departmentId } }
    );

    res.status(200).send(department);
  } catch (error) {
    console.error('Error assigning processes to department:', error);
    res.status(500).send({ message: 'Error assigning processes to department', error });
  }
});

// Remove assigned process from department
router.put('/remove-assignment', authenticateToken, async (req, res) => {
  const { departmentId, processId } = req.body;

  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).send({ message: 'Department not found' });
    }

    department.assignedProcesses = department.assignedProcesses.filter(
      (id) => id.toString() !== processId
    );
    await department.save();

    await BpmnModel.updateMany(
      { _id: processId },
      { $pull: { assignedDepartments: departmentId } }
    );

    res.status(200).send({ message: 'Process removed from department successfully' });
  } catch (error) {
    console.error('Error removing process from department:', error);
    res.status(500).send({ message: 'Error removing process from department', error });
  }
});

// Edit department
router.put('/edit-department', authenticateToken, async (req, res) => {
  const { departmentId, name } = req.body;

  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).send({ message: 'Department not found' });
    }
    department.name = name;
    await department.save();
    res.status(200).send({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error editing department:', error);
    res.status(500).send({ message: 'Error editing department', error });
  }
});

// Delete department
router.delete('/delete-department', authenticateToken, async (req, res) => {
  const { departmentId } = req.body;

  try {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).send({ message: 'Department not found' });
    }

    if (department.subDepartments && department.subDepartments.length > 0) {
      return res.status(400).send({ message: 'Cannot delete department with subDepartments' });
    }

    await Department.findByIdAndDelete(departmentId);
    await Department.updateMany(
      { subDepartments: departmentId },
      { $pull: { subDepartments: departmentId } }
    );

    await DepartmentStructure.updateMany(
      { departments: departmentId },
      { $pull: { departments: departmentId } }
    );

    res.status(200).send({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).send({ message: 'Error deleting department', error });
  }
});

// Helper function to populate sub-departments
const populateSubDepartments = async (department) => {
  await Department.populate(department, { path: 'subDepartments' });
  for (let subDepartment of department.subDepartments) {
    await populateSubDepartments(subDepartment);
  }
};

// Middleware to authenticate either main user or employee
const authenticateEither = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.error('Access Denied: No valid token provided or token invalid.');
    return res.status(401).send({ message: 'Access Denied: No Token Provided' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    console.error('Access Denied: No token found in the header.');
    return res.status(401).send({ message: 'Access Denied: No Token Found' });
  }

  try {
    // First, try to verify as a main user
    const user = jwt.verify(token, secretKey);
    if (user && user.userId) {
      console.log('Authenticated as main user:', user); // Log for debugging
      req.user = user; // Set req.user
      return next();
    }
  } catch (userError) {
    console.log('Failed to authenticate as main user:', userError.message);
  }

  // If the first attempt failed, try to verify as an employee
  try {
    const employee = jwt.verify(token, secretKey);
    if (employee && employee._id) {
      console.log('Authenticated as employee:', employee); // Log for debugging
      req.employee = employee; // Set req.employee
      return next();
    }
  } catch (employeeError) {
    console.log('Failed to authenticate as employee:', employeeError.message);
  }

  console.error('Access Denied: No valid token provided or token invalid for both user and employee.');
  res.status(401).send({ message: 'Access Denied: Invalid Token' });
};


// Fetch department structure for both users and employees
router.get('/', authenticateEither, async (req, res) => {
  let userId;

  try {
    if (req.user) {
      // Main user fetching departments
      userId = req.user.userId;
    } else if (req.employee) {
      // Fetch the employee's company ID
      const employee = await Employee.findById(req.employee._id).populate('company');
      if (!employee || !employee.company) {
        return res.status(404).send({ message: 'Employee or company not found' });
      }
      userId = employee.company._id; // Employee fetching departments under their company
    }

    if (!userId) {
      return res.status(400).send({ message: 'Unable to determine user or employee company ID' });
    }

    const departmentStructure = await DepartmentStructure.findOne({ userId }).populate('departments');

    if (!departmentStructure) {
      return res.status(404).send({ message: 'No department structure found for this user/company' });
    }

    for (let department of departmentStructure.departments) {
      await populateSubDepartments(department);
    }

    res.status(200).send(departmentStructure);
  } catch (error) {
    console.error('Error fetching department structure:', error);
    res.status(500).send({ message: 'Error fetching department structure', error });
  }
});
module.exports = router;
