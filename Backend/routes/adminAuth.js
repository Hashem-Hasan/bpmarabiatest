// routes/adminAuth.js
const express = require('express');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

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
      throw new Error('Unable to login');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new Error('Unable to login');
    }

    const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.send({ token });
  } catch (error) {
    res.status(400).send({ error: 'Unable to login' });
  }
});

module.exports = router;
