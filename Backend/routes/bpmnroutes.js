const express = require('express');
const BpmnModel = require('../models/BpmnModel');
const Employee = require('../models/Employee');
const User = require('../models/User');
const authenticateToken = require('../middleware/authenticateToken');
const authenticateEmployeeToken = require('../middleware/authenticateEmployeeToken');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Helper function to create a log entry
const createLogEntry = async (userId, action, userModel) => {
  let userEmail = '';
  if (userModel === 'User') {
    const user = await User.findById(userId);
    if (user) {
      userEmail = user.businessMail;
    }
  } else {
    const employee = await Employee.findById(userId);
    if (employee) {
      userEmail = employee.email;
    }
  }
  return {
    userId,
    userEmail,
    action,
    userModel,
    timestamp: new Date(),
  };
};

// Middleware to check for either main user or employee token
const authenticate = (req, res, next) => {
  console.log('Authenticating...');
  const authorizationHeader = req.headers['authorization'];
  console.log('Authorization Header:', authorizationHeader);

  const token = authorizationHeader?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).send({ message: 'Access Denied' });
  }

  console.log('Token:', token);

  try {
    const secretKey = process.env.SECRET_KEY || 'your_secret_key_here';
    console.log('Secret Key:', secretKey);

    const decoded = jwt.verify(token, secretKey);
    console.log('Decoded Token:', decoded);

    if (decoded.userId) {
      req.user = decoded;
      console.log('Authenticated User:', req.user);
    } else if (decoded._id) {
      req.employee = decoded;
      console.log('Authenticated Employee:', req.employee);
    }
    next();
  } catch (error) {
    console.log('Invalid Token:', error);
    res.status(400).send({ message: 'Invalid Token' });
  }
};

// Create a new BPMN diagram by the main user or employee
router.post('/', authenticate, async (req, res) => {
  const { name, xml } = req.body;
  const userId = req.user?.userId || req.employee?._id;
  const userModel = req.user ? 'User' : 'Employee';

  let creatorId;

  if (req.user) {
    creatorId = req.user.userId;
  } else if (req.employee) {
    try {
      const employee = await Employee.findById(req.employee._id).populate('company');
      creatorId = employee.company._id;
    } catch (error) {
      console.error('Error fetching employee details:', error);
      return res.status(500).send({ message: 'Error fetching employee details', error });
    }
  }

  console.log('Creating new BPMN diagram...');
  console.log('Name:', name);
  console.log('XML:', xml);
  console.log('User ID:', userId);
  console.log('User Model:', userModel);
  console.log('Creator ID:', creatorId);

  if (!creatorId) {
    console.error('Creator ID is undefined');
    return res.status(500).send({ message: 'Creator ID is undefined' });
  }

  try {
    const logEntry = await createLogEntry(userId, 'created', userModel);
    const newDiagram = new BpmnModel({
      name,
      xml,
      creator: creatorId,
      owners: [userId],
      logs: [logEntry],
      isVerified: !!req.user // Verified if created by main user, false otherwise
    });

    await newDiagram.save();
    console.log('BPMN diagram saved successfully');
    res.status(201).send(newDiagram);
  } catch (error) {
    console.error('Error saving BPMN diagram:', error);
    res.status(500).send({ message: 'Error saving BPMN diagram', error });
  }
});



// Get all BPMN diagrams created by the logged-in main user (for main token)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const diagrams = await BpmnModel.find({ creator: req.user.userId }).populate('owners').populate('assignedRoles');
    res.status(200).send(diagrams);
  } catch (error) {
    console.error('Error fetching BPMN diagrams:', error);
    res.status(500).send({ message: 'Error fetching BPMN diagrams', error });
  }
});

// Get BPMN diagrams owned by the logged-in employee (for employee token)
router.get('/owned', authenticateEmployeeToken, async (req, res) => {
  try {
    const diagrams = await BpmnModel.find({ owners: req.employee._id }).populate('owners').populate('assignedRoles');
    res.status(200).send(diagrams);
  } catch (error) {
    console.error('Error fetching BPMN diagrams:', error);
    res.status(500).send({ message: 'Error fetching BPMN diagrams', error });
  }
});

// Generic route to handle both main token and employee token
router.get('/all-or-owned', authenticate, async (req, res) => {
  try {
    const user = req.user || req.employee;
    const diagrams = user.email
      ? await BpmnModel.find({ creator: user.userId }).populate('owners').populate('assignedRoles')
      : await BpmnModel.find({ owners: user._id }).populate('owners').populate('assignedRoles');
    res.status(200).send(diagrams);
  } catch (error) {
    console.error('Error fetching BPMN diagrams:', error);
    res.status(500).send({ message: 'Error fetching BPMN diagrams', error });
  }
});

// Get a specific BPMN diagram by ID (ensure it's owned by the logged-in employee or created by the logged-in main user)
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.employee?._id;

  try {
    const diagram = await BpmnModel.findOne({ _id: id, $or: [{ creator: userId }, { owners: userId }] }).populate('owners').populate('assignedRoles');
    if (diagram) {
      res.status(200).send(diagram);
    } else {
      res.status(404).send({ message: 'Diagram not found or you do not have permission to view it' });
    }
  } catch (error) {
    console.error('Error fetching BPMN diagram:', error);
    res.status(500).send({ message: 'Error fetching BPMN diagram', error });
  }
});

// Update a BPMN diagram by ID (ensure it's owned by the logged-in employee or created by the logged-in main user)
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, xml, ownerIds, assignedRoles } = req.body;

  let userId, userModel;
  if (req.user) {
    userId = req.user.userId;
    userModel = 'User';
  } else if (req.employee) {
    userId = req.employee._id;
    userModel = 'Employee';
  } else {
    return res.status(400).send({ message: 'Invalid Token' });
  }

  try {
    const diagram = await BpmnModel.findById(id);
    if (!diagram) {
      return res.status(404).send({ message: 'Diagram not found' });
    }

    // Ensure the logged-in user is either the creator or one of the owners
    if (diagram.creator?.toString() !== userId.toString() && !diagram.owners.includes(userId)) {
      return res.status(403).send({ message: 'Permission denied' });
    }

    // Only update fields that are provided in the request
    diagram.name = name || diagram.name;
    diagram.xml = xml || diagram.xml;
    diagram.assignedRoles = assignedRoles || diagram.assignedRoles;
    if (ownerIds && ownerIds.length > 0) {
      diagram.owners = Array.from(new Set([...diagram.owners, ...ownerIds])); // Merge existing and new owners
    }
    const logEntry = await createLogEntry(userId, 'updated', userModel);
    diagram.logs.push(logEntry);

    await diagram.save();

    // Update the ownedProcesses field in Employee model
    if (ownerIds && ownerIds.length > 0) {
      await Employee.updateMany(
        { _id: { $in: ownerIds } },
        { $addToSet: { ownedProcesses: id } }
      );
    }

    res.status(200).send(diagram);
  } catch (error) {
    console.error('Error updating BPMN diagram:', error);
    res.status(500).send({ message: 'Error updating BPMN diagram', error });
  }
});

// Delete a BPMN diagram by ID (only allow main user)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const diagram = await BpmnModel.findOne({ _id: id, creator: userId });
    if (!diagram) {
      return res.status(404).send({ message: 'Diagram not found or you do not have permission to delete it' });
    }

    const logEntry = await createLogEntry(userId, 'deleted', 'User');
    diagram.logs.push(logEntry);
    await diagram.deleteOne();

    // Remove the process reference from all employees
    await Employee.updateMany(
      { ownedProcesses: id },
      { $pull: { ownedProcesses: id } }
    );

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting BPMN diagram:', error);
    res.status(500).send({ message: 'Error deleting BPMN diagram', error });
  }
});

// Remove an owner from a BPMN diagram (only allow main user)
router.put('/remove-owner/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { ownerId } = req.body;
  const userId = req.user.userId;

  try {
    const diagram = await BpmnModel.findById(id);
    if (!diagram) {
      return res.status(404).send({ message: 'Diagram not found' });
    }

    // Ensure the logged-in user is the creator
    if (diagram.creator.toString() !== userId.toString()) {
      return res.status(403).send({ message: 'Permission denied' });
    }

    diagram.owners = diagram.owners.filter(owner => owner.toString() !== ownerId);
    const logEntry = await createLogEntry(userId, 'removed owner', 'User');
    diagram.logs.push(logEntry);

    await diagram.save();

    // Update the ownedProcesses field in Employee model
    await Employee.updateMany(
      { _id: ownerId },
      { $pull: { ownedProcesses: id } }
    );

    res.status(200).send(diagram);
  } catch (error) {
    console.error('Error removing owner from BPMN diagram:', error);
    res.status(500).send({ message: 'Error removing owner from BPMN diagram', error });
  }
});

// Route to toggle isVerified status
router.put('/toggle-verify/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const diagram = await BpmnModel.findById(id);
    if (!diagram) {
      return res.status(404).send({ message: 'Diagram not found' });
    }

    // Ensure the logged-in user is the creator
    if (diagram.creator.toString() !== userId.toString()) {
      return res.status(403).send({ message: 'Permission denied' });
    }

    diagram.isVerified = !diagram.isVerified;
    const logEntry = await createLogEntry(userId, diagram.isVerified ? 'verified' : 'unverified', 'User');
    diagram.logs.push(logEntry);

    await diagram.save();

    res.status(200).send(diagram);
  } catch (error) {
    console.error('Error toggling verify status:', error);
    res.status(500).send({ message: 'Error toggling verify status', error });
  }
});

module.exports = router;
