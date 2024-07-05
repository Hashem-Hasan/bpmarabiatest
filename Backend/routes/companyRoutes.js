const express = require('express');
const User = require('../models/user');
const BpmnModel = require('../models/BpmnModel');
const authenticateToken = require('../middleware/authenticateToken');
const authenticateEmployeeToken = require('../middleware/authenticateEmployeeToken');
const router = express.Router();

// Route to get company info by diagram ID
router.get('/company-info/:diagramId', authenticateToken, authenticateEmployeeToken, async (req, res) => {
  const { diagramId } = req.params;

  try {
    const diagram = await BpmnModel.findById(diagramId).populate('creator');

    if (!diagram) {
      return res.status(404).send({ message: 'Diagram not found' });
    }

    const company = diagram.creator;

    if (!company) {
      return res.status(404).send({ message: 'Company not found' });
    }

    res.status(200).send({
      companyName: company.companyName,
      phoneNumber: company.phoneNumber,
    });
  } catch (error) {
    console.error('Error fetching company info:', error);
    res.status(500).send({ message: 'Error fetching company info', error });
  }
});

module.exports = router;
