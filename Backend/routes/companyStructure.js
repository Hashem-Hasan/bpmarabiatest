const express = require('express');
const { CompanyStructure, Role } = require('../models/CompanyStructure');
const BpmnModel = require('../models/BpmnModel');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

// Add role
router.post('/add-role', authenticateToken, async (req, res) => {
  const { parentId, name } = req.body;
  const userId = req.user.userId;

  try {
    const newRole = new Role({ name, subRoles: [] });
    await newRole.save();

    if (parentId) {
      const parentRole = await Role.findById(parentId);
      if (!parentRole) {
        throw new Error('Parent role not found');
      }
      parentRole.subRoles.push(newRole._id);
      await parentRole.save();
    } else {
      let companyStructure = await CompanyStructure.findOne({ userId });
      if (!companyStructure) {
        companyStructure = new CompanyStructure({ userId, roles: [] });
      }
      companyStructure.roles.push(newRole._id);
      await companyStructure.save();
    }

    res.status(201).send({ message: 'Role added successfully', newRole });
  } catch (error) {
    console.error('Error adding role:', error);
    res.status(500).send({ message: 'Error adding role', error });
  }
});

// Assign processes to role
router.put('/assign-processes', authenticateToken, async (req, res) => {
  const { roleId, processIds } = req.body;

  try {
    // Ensure the role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).send({ message: 'Role not found' });
    }

    // Assign processes to the role
    role.assignedProcesses = [...new Set([...role.assignedProcesses, ...processIds])];
    await role.save();

    // Update the process model to include the role
    await BpmnModel.updateMany(
      { _id: { $in: processIds } },
      { $addToSet: { assignedRoles: roleId } }
    );

    res.status(200).send(role);
  } catch (error) {
    console.error('Error assigning processes to role:', error);
    res.status(500).send({ message: 'Error assigning processes to role', error });
  }
});

// Remove assigned process from role
router.put('/remove-assignment', authenticateToken, async (req, res) => {
  const { roleId, processId } = req.body;

  try {
    // Ensure the role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).send({ message: 'Role not found' });
    }

    // Remove the process from the role
    role.assignedProcesses = role.assignedProcesses.filter(
      (id) => id.toString() !== processId
    );
    await role.save();

    // Update the process model to remove the role
    await BpmnModel.updateMany(
      { _id: processId },
      { $pull: { assignedRoles: roleId } }
    );

    res.status(200).send({ message: 'Process removed from role successfully' });
  } catch (error) {
    console.error('Error removing process from role:', error);
    res.status(500).send({ message: 'Error removing process from role', error });
  }
});

// Edit role
router.put('/edit-role', authenticateToken, async (req, res) => {
  const { roleId, name } = req.body;

  try {
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).send({ message: 'Role not found' });
    }
    role.name = name;
    await role.save();
    res.status(200).send({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error editing role:', error);
    res.status(500).send({ message: 'Error editing role', error });
  }
});

// Delete role
router.delete('/delete-role', authenticateToken, async (req, res) => {
  const { roleId } = req.body;

  try {
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).send({ message: 'Role not found' });
    }

    if (role.subRoles && role.subRoles.length > 0) {
      return res.status(400).send({ message: 'Cannot delete role with subRoles' });
    }

    await Role.findByIdAndDelete(roleId);
    await Role.updateMany(
      { subRoles: roleId },
      { $pull: { subRoles: roleId } }
    );

    await CompanyStructure.updateMany(
      { roles: roleId },
      { $pull: { roles: roleId } }
    );

    res.status(200).send({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).send({ message: 'Error deleting role', error });
  }
});

// Fetch company structure
const populateSubRoles = async (role) => {
  await Role.populate(role, { path: 'subRoles' });
  for (let subRole of role.subRoles) {
    await populateSubRoles(subRole);
  }
};

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const companyStructure = await CompanyStructure.findOne({ userId }).populate('roles');

    if (!companyStructure) {
      return res.status(404).send({ message: 'No company structure found for this user' });
    }

    for (let role of companyStructure.roles) {
      await populateSubRoles(role);
    }

    res.status(200).send(companyStructure);
  } catch (error) {
    console.error('Error fetching company structure:', error);
    res.status(500).send({ message: 'Error fetching company structure', error });
  }
});

module.exports = router;
