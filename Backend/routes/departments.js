const express = require('express');
const { Department } = require('../models/Department');
const BpmnModel = require('../models/BpmnModel');
const authenticate = require('../middleware/authenticateToken'); // Import authentication middleware
const router = express.Router();

// Get departments with processes for the logged-in user
router.get('/departments-with-processes', authenticate, async (req, res) => {
  let userId;

  // Determine the user ID based on the token
  if (req.user) {
    userId = req.user.userId;
  } else if (req.employee) {
    userId = req.employee._id;
  } else {
    return res.status(400).send({ message: 'Invalid Token' });
  }

  try {
    // Fetch processes associated with the logged-in user
    const processes = await BpmnModel.find({
      department: { $exists: true, $ne: null },
      $or: [
        { creator: userId },
        { owners: userId },
      ],
    }).populate('department');

    // Group processes by department
    const departmentsMap = {};

    processes.forEach((process) => {
      if (process.department && process.department._id) {
        const departmentId = process.department._id.toString();
        if (!departmentsMap[departmentId]) {
          departmentsMap[departmentId] = {
            department: process.department,
            processes: [],
          };
        }
        departmentsMap[departmentId].processes.push(process);
      } else {
        console.warn(`Process with ID ${process._id} does not have a valid department.`);
      }
    });

    // Convert map to array
    const departmentsWithProcesses = Object.values(departmentsMap);

    res.status(200).send(departmentsWithProcesses);
  } catch (error) {
    console.error('Error fetching departments and processes:', error);
    res.status(500).send({ message: 'Error fetching departments and processes', error });
  }
});

module.exports = router;
