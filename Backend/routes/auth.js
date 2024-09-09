const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();
const secretKey = 'your_secret_key_here';

// Validate Token
router.get('/validate-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ valid: false });
    }
    res.status(200).json({ valid: true });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(500).json({ valid: false });
  }
});

// Sign Up
router.post('/signup', async (req, res) => {
  const { fullName, businessMail, companyName, companySize, phoneNumber, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, businessMail, companyName, companySize, phoneNumber, password: hashedPassword });
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
