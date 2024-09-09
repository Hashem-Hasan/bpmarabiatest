const express = require('express');
const { Department } = require('../models/Department');
const BpmnModel = require('../models/BpmnModel');
const router = express.Router();

router.get('/departments-with-processes', async (req, res) => {
  try {
    // Fetch all processes that are associated with departments
    const processes = await BpmnModel.find({ department: { $exists: true, $ne: null } }).populate('department');

    // Group processes by department
    const departmentsMap = {};

    processes.forEach((process) => {
      // Check if process has a valid department
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
