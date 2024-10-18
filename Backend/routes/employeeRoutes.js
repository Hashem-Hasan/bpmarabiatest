const express = require('express');
const Employee = require('../models/Employee');
const BpmnModel = require('../models/BpmnModel'); // Ensure this line is included
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateEmployeeToken = require('../middleware/authenticateEmployeeToken');

const router = express.Router();
const secretKey = process.env.SECRET_KEY || 'your_secret_key_here';

// Employee Login
router.post('/login', async (req, res) => {
  let { email, password, companyName } = req.body;

  if (!companyName) {
    return res.status(400).send({ message: 'Company name is required' });
  }

  // Trim and convert company name to lowercase for comparison
  companyName = companyName.trim().toLowerCase();

  try {
    // Fetch employee details and populate the company reference
    const employee = await Employee.findOne({ email }).populate('company');
    if (!employee) {
      return res.status(400).send({ message: 'Password or email is incorrect' });
    }

    // Ensure the company is associated with the employee and has a companyName field
    if (!employee.company || !employee.company.companyName) {
      return res.status(400).send({ message: 'Company information is missing for the employee' });
    }

    // Check if the company name matches (case-insensitive and trimmed)
    if (employee.company.companyName.trim().toLowerCase() !== companyName) {
      return res.status(400).send({ message: 'Invalid company name' });
    }

    // Check if the associated company is activated
    if (!employee.company.isActivated) {
      return res.status(403).send({ message: 'Your account is disabled, please contact customer service team for support' });
    }

    // Verify the employee password
    const validPassword = await bcrypt.compare(password, employee.password);
    if (!validPassword) {
      return res.status(400).send({ message: 'Password or email is incorrect' });
    }

    // Generate token
    const token = jwt.sign(
      { _id: employee._id, email: employee.email, fullName: employee.fullName },
      process.env.SECRET_KEY || 'your_secret_key_here', // Correctly reference the secret key
      { expiresIn: '1h' } // Set expiration time to 1 hour
    );
    
    console.log('Generated Token:', token); // Debugging token generation
    res.status(200).send({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send({ message: 'Error logging in', error });
  }
});




// Get employee info
router.get('/me', authenticateEmployeeToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id).select('-password');
    if (!employee) {
      return res.status(404).send({ message: 'Employee not found' });
    }
    res.status(200).send(employee);
  } catch (error) {
    console.error('Error fetching employee info:', error);
    res.status(500).send({ message: 'Error fetching employee info', error });
  }
});

// Update employee info
router.put('/update', authenticateEmployeeToken, async (req, res) => {
  const { phoneNumber, oldPassword, newPassword } = req.body;

  try {
    const employee = await Employee.findById(req.employee._id);
    if (!employee) {
      return res.status(404).send({ message: 'Employee not found' });
    }

    // Verify the old password
    const validPassword = await bcrypt.compare(oldPassword, employee.password);
    if (!validPassword) {
      return res.status(400).send({ message: 'Invalid old password' });
    }

    // Update the phone number if provided
    employee.phoneNumber = phoneNumber || employee.phoneNumber;

    // Update the password if a new password is provided
    if (newPassword) {
      // Check if the new password is different from the old password
      const isSamePassword = await bcrypt.compare(newPassword, employee.password);
      if (isSamePassword) {
        return res.status(400).send({ message: 'New password cannot be the same as the old password' });
      }

      // Assign the new password directly (hashing is handled by the schema)
      employee.password = newPassword;
    }

    // Save the updated employee info
    await employee.save();
    res.status(200).send({ message: 'Employee info updated successfully' });
  } catch (error) {
    console.error('Error updating employee info:', error);
    res.status(500).send({ message: 'Error updating employee info', error });
  }
});


// Get employee tasks based on role and fetch department
router.get('/tasks', authenticateEmployeeToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee._id).populate('role');
    if (!employee) {
      return res.status(404).send({ message: 'Employee not found' });
    }

    const processes = await BpmnModel.find({ assignedRoles: employee.role._id, isVerified: true }).populate('department');

    res.status(200).send(processes);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send({ message: 'Error fetching tasks', error });
  }
});

module.exports = router;
