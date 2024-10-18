const express = require('express');
const mongoose = require('mongoose');  // Import mongoose
const router = express.Router();
const Business = require('../models/user'); // Adjust the path as necessary
const Employee = require('../models/Employee'); // Adjust the path as necessary
const Process = require('../models/BpmnModel'); // Adjust the path as necessary
const Admin = require('../models/Admin'); // Adjust the path as necessary
const Support = require('../models/Support'); // Adjust the path as necessary
const authenticateAdminToken = require('../middleware/authenticateAdminToken');
const authenticateSupportToken = require('../middleware/authenticateSupportToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Admin registration
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const admin = new Admin({ username, password });

  try {
    await admin.save();
    res.status(201).send({ message: 'Admin registered successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Admin login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.error('Admin not found');
      return res.status(400).send({ error: 'Unable to login' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      console.error('Password does not match');
      return res.status(400).send({ error: 'Unable to login' });
    }

    const token = jwt.sign({ _id: admin._id, isAdmin: true }, 'your_secret_key_here', {
      expiresIn: '1h'
    });

    res.send({ token });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(400).send({ error: 'Unable to login' });
  }
});

// Support registration
router.post('/support/register', authenticateAdminToken, async (req, res) => {
  const { username, password } = req.body;
  const support = new Support({ username, password });

  try {
    await support.save();
    res.status(201).send({ message: 'Support registered successfully' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Support login route
router.post('/support/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const support = await Support.findOne({ username });
    if (!support) {
      console.error('Support not found');
      return res.status(404).send({ error: 'Support not found' });
    }

    const isMatch = await bcrypt.compare(password, support.password);
    if (!isMatch) {
      console.error('Password does not match');
      return res.status(400).send({ error: 'Unable to login' });
    }

    const token = jwt.sign({ _id: support._id }, 'your_secret_key_here', {
      expiresIn: '1h'
    });

    res.send({ token });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).send({ error: 'Unable to login' });
  }
});

// GET all support accounts
router.get('/support', authenticateAdminToken, async (req, res) => {
  try {
    const supports = await Support.find();
    res.json(supports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE support account by ID
router.delete('/support/:id', authenticateAdminToken, async (req, res) => {
  try {
    const support = await Support.findByIdAndDelete(req.params.id);
    if (!support) {
      return res.status(404).json({ message: 'Support not found' });
    }
    res.json({ message: 'Support account deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE support account by ID
router.put('/support/:id', authenticateAdminToken, async (req, res) => {
  const { username, password } = req.body;
  try {
    const support = await Support.findById(req.params.id);
    if (!support) {
      return res.status(404).json({ message: 'Support not found' });
    }
    support.username = username;
    if (password) {
      support.password = password;
    }
    await support.save();
    res.json({ message: 'Support account updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign companies to support
router.post('/support/:id/assign', authenticateAdminToken, async (req, res) => {
  const { companyId } = req.body;
  const { id } = req.params;

  try {
    const support = await Support.findById(id);
    if (!support) {
      return res.status(404).send({ message: 'Support not found' });
    }

    // Check if the company is already assigned
    if (!support.assignedCompanies.includes(companyId)) {
      support.assignedCompanies.push(companyId);
      await support.save();
    }

    res.send({ message: 'Company assigned to support' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Remove assigned company from support
router.post('/support/:id/unassign', authenticateAdminToken, async (req, res) => {
  const { companyId } = req.body;
  const { id } = req.params;

  try {
    const support = await Support.findById(id);
    if (!support) {
      return res.status(404).send({ message: 'Support not found' });
    }

    support.assignedCompanies.pull(companyId);
    await support.save();

    res.send({ message: 'Company unassigned from support' });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// GET all businesses with aggregated info (admin and support)
router.get('/businesses', async (req, res) => {
  try {
    let businesses;
    const token = req.header('Authorization').replace('Bearer ', '');

    if (!token) {
      return res.status(401).send({ error: 'Authentication required' });
    }

    const data = jwt.verify(token, 'your_secret_key_here');
    const isAdmin = data.isAdmin || false;

    if (isAdmin) {
      businesses = await Business.find();
    } else {
      const support = await Support.findById(data._id);
      if (!support) {
        return res.status(401).send({ error: 'Invalid token' });
      }
      businesses = await Business.find({ _id: { $in: support.assignedCompanies } });
    }

    const businessesWithInfo = await Promise.all(
      businesses.map(async (business) => {
        const employeesNumber = await Employee.countDocuments({ company: business._id });
        const processesNumber = await Process.countDocuments({ creator: business._id });

        return {
          ...business.toObject(),
          employeesNumber,
          processesNumber,
          logo: business.logo, // Ensure the logo field is included in the response
        };
      })
    );

    res.json(businessesWithInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET business details by ID
router.get('/businesses/:id', async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const data = jwt.verify(token, 'your_secret_key_here');
    const isAdmin = data.isAdmin || false;

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (!isAdmin) {
      const support = await Support.findById(data._id);
      if (!support || !support.assignedCompanies.includes(business._id.toString())) {
        return res.status(403).send({ error: 'Access denied' });
      }
    }

    const employees = await Employee.find({ company: business._id }).populate('role');
    const processes = await Process.find({ creator: business._id });

    res.json({
      ...business.toObject(),
      employees,
      processes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to check if the logged-in user is an admin
router.get('/check-role', authenticateAdminToken, async (req, res) => {
  try {
    if (req.admin) {
      res.json({ isAdmin: true });
    } else {
      res.json({ isAdmin: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// PATCH activate business account
router.patch('/businesses/:id/activate', authenticateAdminToken, async (req, res) => {
  console.log('Received request to activate business as admin');
  try {
    const { duration } = req.body;
    const business = await Business.findById(req.params.id);
    const adminUsername = req.admin.username;  // Corrected to use req.admin

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    let activationExpires;
    const now = new Date();

    switch (duration) {
      case 'month':
        activationExpires = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case '3 months':
        activationExpires = new Date(now.setMonth(now.getMonth() + 3));
        break;
      case '6 months':
        activationExpires = new Date(now.setMonth(now.getMonth() + 6));
        break;
      case 'year':
        activationExpires = new Date(now.setFullYear(now.getFullYear() + 1));
        break;
      default:
        activationExpires = null;
    }

    business.isActivated = true;
    business.activationExpires = activationExpires;

    // Log the activation action
    business.logs.push({
      action: 'Activated',
      performedBy: adminUsername,
      period: duration
    });

    await business.save();

    console.log('Business activated:', business);
    res.json({ message: 'Business activated', activationExpires });
  } catch (error) {
    console.error('Error activating business:', error);
    res.status(500).json({ message: error.message });
  }
});

// PATCH deactivate business account
router.patch('/businesses/:id/deactivate', authenticateAdminToken, async (req, res) => {
  console.log('Received request to deactivate business as admin');
  try {
    const business = await Business.findById(req.params.id);
    const adminUsername = req.admin.username;  // Corrected to use req.admin

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    business.isActivated = false;
    business.activationExpires = null;

    // Log the deactivation action
    business.logs.push({
      action: 'Deactivated',
      performedBy: adminUsername
    });

    await business.save();

    console.log('Business deactivated:', business);
    res.json({ message: 'Business deactivated' });
  } catch (error) {
    console.error('Error deactivating business:', error);
    res.status(500).json({ message: error.message });
  }
});

// Support routes for business activation/deactivation
router.patch('/support/businesses/:id/activate', authenticateSupportToken, async (req, res) => {
  console.log('Received request to activate business as support');
  try {
    const { duration } = req.body;
    const business = await Business.findById(req.params.id);
    const supportUsername = req.support.username;  // Corrected to use req.support

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (!req.support.assignedCompanies.includes(business._id)) {
      return res.status(403).send({ error: 'Access denied' });
    }

    let activationExpires;
    const now = new Date();

    switch (duration) {
      case 'month':
        activationExpires = new Date(now.setMonth(now.getMonth() + 1));
        break;
      case '3 months':
        activationExpires = new Date(now.setMonth(now.getMonth() + 3));
        break;
      case '6 months':
        activationExpires = new Date(now.setMonth(now.getMonth() + 6));
        break;
      case 'year':
        activationExpires = new Date(now.setFullYear(now.getFullYear() + 1));
        break;
      default:
        activationExpires = null;
    }

    business.isActivated = true;
    business.activationExpires = activationExpires;

    // Log the activation action
    business.logs.push({
      action: 'Activated',
      performedBy: supportUsername,
      period: duration
    });

    await business.save();

    console.log('Business activated:', business);
    res.json({ message: 'Business activated', activationExpires });
  } catch (error) {
    console.error('Error activating business as support:', error);
    res.status(500).json({ message: error.message });
  }
});

router.patch('/support/businesses/:id/deactivate', authenticateSupportToken, async (req, res) => {
  console.log('Received request to deactivate business as support');
  try {
    const business = await Business.findById(req.params.id);
    const supportUsername = req.support.username;  // Corrected to use req.support

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (!req.support.assignedCompanies.includes(business._id)) {
      return res.status(403).send({ error: 'Access denied' });
    }

    business.isActivated = false;
    business.activationExpires = null;

    // Log the deactivation action
    business.logs.push({
      action: 'Deactivated',
      performedBy: supportUsername
    });

    await business.save();

    console.log('Business deactivated:', business);
    res.json({ message: 'Business deactivated' });
  } catch (error) {
    console.error('Error deactivating business as support:', error);
    res.status(500).json({ message: error.message });
  }
});

// Combined endpoint for Admin and Support to change user password
router.patch('/users/:id/change-password', async (req, res) => {
  const { newPassword } = req.body;
  const { id } = req.params;

  if (!newPassword) {
    return res.status(400).send({ message: 'New password is required' });
  }

  // Check if the request is made by either an admin or support
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key_here');

    // Determine whether the request is made by an admin or support
    let actorUsername;

    // Check if the user is an Admin
    if (decoded.isAdmin) {
      const admin = await Admin.findById(decoded._id);
      if (!admin) {
        return res.status(403).send({ message: 'Invalid Admin credentials' });
      }
      actorUsername = admin.username;  // Retrieve admin username

      const user = await Business.findById(id);
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      // Log the password change action
      user.logs.push({
        action: 'Password Changed',
        performedBy: actorUsername
      });

      await user.save();
      return res.status(200).send({ message: 'Password changed successfully by Admin' });
    }

    // Check if the user is Support and has permission to change the password
    const support = await Support.findById(decoded._id);
    if (support) {
      actorUsername = support.username;  // Retrieve support username

      const user = await Business.findById(id);
      if (!user) {
        return res.status(404).send({ message: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      // Log the password change action
      user.logs.push({
        action: 'Password Changed',
        performedBy: actorUsername
      });

      await user.save();
      return res.status(200).send({ message: 'Password changed successfully by Support' });
    }

    return res.status(403).send({ message: 'Access denied' });

  } catch (error) {
    console.error('Error changing password:', error.message);
    return res.status(500).send({ message: 'Error changing password', error: error.message });
  }
});

// GET all logs for all businesses or a specific business
router.get('/users/logs', authenticateAdminToken, async (req, res) => {
  try {
    const { userId } = req.query; // Optional query parameter to filter by user ID

    let logs;

    if (userId) {
      // Find the specific business and return its logs
      const business = await Business.findById(userId).select('logs');
      if (!business) {
        return res.status(404).json({ message: 'Business not found' });
      }
      logs = business.logs;
    } else {
      // Get logs from all businesses
      const allBusinesses = await Business.find().select('logs companyName businessMail');
      logs = allBusinesses.map(business => ({
        companyName: business.companyName,
        businessMail: business.businessMail,
        logs: business.logs
      }));
    }

    res.json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Error fetching logs', error: error.message });
  }
});



// Combined endpoint for Admin and Support to update a BPMN diagram by ID
router.put('/bpmnroutes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, xml } = req.body;  // Only name and xml are expected

  // Log incoming request details
  console.log('Received request to update BPMN diagram:', { id, name });

  // Check if the `id` parameter is provided and valid
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    console.log('Invalid or missing BPMN diagram ID:', id);
    return res.status(400).send({ message: 'Valid diagram ID is required' });
  }

  // Check if the request is made by either an admin or support
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.log('No token provided');
    return res.status(401).send({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key_here');
    console.log('Token decoded:', decoded);

    let userId, userModel;

    // Identify if the user is Admin or Support
    if (decoded.isAdmin) {
      userId = decoded._id;  // Use the decoded token's _id
      userModel = 'Admin';
      console.log('User is Admin:', decoded._id);
    } else {
      const support = await Support.findById(decoded._id);
      if (support) {
        userId = decoded._id;  // Use the decoded token's _id
        userModel = 'Support';
        console.log('User is Support:', decoded._id);
      } else {
        console.log('Access denied: User is neither Admin nor Support');
        return res.status(403).send({ message: 'Access denied' });
      }
    }

    // Fetch the diagram
    const diagram = await Process.findById(id);
    if (!diagram) {
      console.log('Diagram not found:', id);
      return res.status(404).send({ message: 'Diagram not found' });
    }

    // Bypass all checks for Admin and Support, proceed directly to update
    console.log(`Admin or Support updating diagram: ${diagram._id} by user: ${userId}`);

    // Only update the name and xml fields
    if (name) {
      diagram.name = name;
    }
    if (xml) {
      diagram.xml = xml;
    }

    // Skip log creation if the editor is Admin or Support
    if (userModel !== 'Admin' && userModel !== 'Support') {
      // Create a log entry for regular users
      const logEntry = await createLogEntry(userId, 'updated', userModel);
      diagram.logs.push(logEntry);
    }

    await diagram.save();
    console.log('Diagram updated successfully:', diagram._id);

    // Perform additional operations safely
    try {
      console.log('Performing additional operations after saving diagram...');
      
      // Example additional operation that could cause errors
      // Ensure all IDs are defined and valid before using them in queries
      const anotherDocumentId = diagram.relatedDocumentId; // Example related document ID

      // Check if the ID is valid before proceeding
      if (!anotherDocumentId || !mongoose.Types.ObjectId.isValid(anotherDocumentId)) {
        console.error('Invalid related document ID:', anotherDocumentId);
      } else {
        // Proceed with the related operation safely
        const anotherDocument = await AnotherModel.findById(anotherDocumentId); // Example model usage
        if (!anotherDocument) {
          console.error('Another document not found:', anotherDocumentId);
        } else {
          console.log('Another document fetched successfully:', anotherDocument);
          // Further processing...
        }
      }

    } catch (additionalError) {
      console.error('Error during additional operations:', additionalError.message);
    }

    res.status(200).send(diagram);
  } catch (error) {
    console.error('Error updating BPMN diagram:', error.message);
    res.status(500).send({ message: 'Error updating BPMN diagram', error: error.message });
  }
});


module.exports = router;
