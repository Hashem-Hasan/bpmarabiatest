const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Employee = require('../models/Employee'); // Assuming there's an employee model
const authenticateToken = require('../middleware/authenticateToken');
const authenticateEmployeeToken = require('../middleware/authenticateEmployeeToken');
const router = express.Router();
const secretKey = 'your_secret_key_here';
const tokenExpiryTime = '10h'; // 10 hours expiration


// Unified Middleware for Admin and Employee Authentication
const unifiedAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader);

  if (!authHeader) {
    console.log('No authorization header provided');
    return res.status(401).json({ valid: false, message: 'No token provided' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    console.log('Invalid authorization header format');
    return res.status(401).json({ valid: false, message: 'Invalid authorization header format' });
  }

  const token = tokenParts[1];
  console.log('Token received:', token);

  if (!token) {
    console.log('No token found after Bearer');
    return res.status(401).json({ valid: false, message: 'Invalid token format' });
  }

  // Try to verify the token
  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) {
      console.error('Error verifying token:', err.message);
      if (err.name === 'TokenExpiredError') {
        console.error('Token has expired at:', new Date(err.expiredAt).toISOString());
      }
      return res.status(401).json({ valid: false, message: 'Invalid token' });
    }

    // Token is valid
    console.log('Token successfully verified');
    // Log token expiry time
    const expiryTimestamp = decoded.exp * 1000; // Convert to milliseconds
    const expiryDate = new Date(expiryTimestamp);
    console.log(`Token expires at: ${expiryDate.toISOString()}`);

    req.decoded = decoded;
    next();
  });
};

// Function to renew token and log expiry time
function renewToken(payload, role) {
  const token = jwt.sign(payload, secretKey, { expiresIn: tokenExpiryTime });

  // Decode the token to get the expiry time
  const decodedToken = jwt.decode(token);
  const expiryTimestamp = decodedToken.exp * 1000; // Convert to milliseconds
  const expiryDate = new Date(expiryTimestamp);

  console.log(`Generated new token for ${role} with ID ${payload.userId || payload._id}. New Expiry Time: ${expiryDate.toISOString()}`);

  return token;
}

// Validate Token Route
router.get('/validate-token', unifiedAuthMiddleware, async (req, res) => {
  console.log('--- Incoming request to /validate-token ---');
  console.log('Decoded Token:', req.decoded);

  try {
    let newToken = null;

    if (req.decoded.userId) {
      // Check for admin user
      console.log('Checking for admin user with userId:', req.decoded.userId);
      const user = await User.findById(req.decoded.userId);
      if (user) {
        console.log('Token belongs to admin:', user.email);

        // Renew token and send back
        newToken = renewToken({ userId: user._id }, 'admin');
        console.log('New token generated for admin');

        return res.status(200).json({ valid: true, role: 'admin', token: newToken });
      } else {
        console.log('No admin user found with userId:', req.decoded.userId);
      }
    } else {
      console.log('No userId found in decoded token');
    }

    if (req.decoded._id) {
      // Check for employee user
      console.log('Checking for employee with employeeId:', req.decoded._id);
      const employee = await Employee.findById(req.decoded._id);
      if (employee) {
        console.log('Token belongs to employee:', employee.email);

        // Renew token and send back
        newToken = renewToken({ _id: employee._id }, 'employee');
        console.log('New token generated for employee');

        return res.status(200).json({ valid: true, role: 'employee', token: newToken });
      } else {
        console.log('No employee found with _id:', req.decoded._id);
      }
    } else {
      console.log('No _id found in decoded token');
    }

    // If no user or employee found
    console.log('No user or employee found for token');
    return res.status(401).json({ valid: false, message: 'Invalid token' });

  } catch (error) {
    console.error('Error in /validate-token:', error.message);
    return res.status(500).json({ valid: false, message: 'Internal server error' });
  }
});



// Sign Up
router.post('/signup', async (req, res) => {
  const { fullName, businessMail, companyName, companySize, phoneNumber, password, logo } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, businessMail, companyName, companySize, phoneNumber, password: hashedPassword, logo });
    await newUser.save();
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error signing up', error });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { businessMail, password } = req.body;

  try {
    const user = await User.findOne({ businessMail });
    if (!user) {
      return res.status(400).send({ message: 'Invalid credentials' });
    }

    // Check if the account is activated
    if (!user.isActivated) {
      return res.status(403).send({ message: 'Your account is disabled, please contact customer service team for support' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id, fullName: user.fullName }, secretKey, { expiresIn: '1h' });
    console.log("Generated Token Payload:", jwt.decode(token)); // Log the payload
    res.status(200).send({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).send({ message: 'Error logging in', error });
  }
});


// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).send({ message: 'Logout successful' });
});

// Get Current User
router.get('/current', (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).send({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    User.findById(decoded.userId, (err, user) => {
      if (err || !user) {
        return res.status(404).send({ message: 'User not found' });
      }
      res.status(200).send({ user });
    });
  } catch (error) {
    res.status(401).send({ message: 'Invalid token', error });
  }
});

// Get user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }
    res.status(200).send(user);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).send({ message: 'Error fetching user info', error });
  }
});

// Update user info
router.put('/update', authenticateToken, async (req, res) => {
  const { phoneNumber, oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) {
      return res.status(400).send({ message: 'Invalid old password' });
    }

    user.phoneNumber = phoneNumber || user.phoneNumber;
    if (newPassword) {
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.status(200).send({ message: 'User info updated successfully' });
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).send({ message: 'Error updating user info', error });
  }
});


module.exports = router;
