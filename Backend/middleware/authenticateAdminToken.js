// middleware/authenticateAdminToken.js
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const authenticateAdminToken = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, 'your_secret_key_here');
    const admin = await Admin.findOne({ _id: decoded._id });

    if (!admin) {
      throw new Error();
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate as admin.' });
  }
};

module.exports = authenticateAdminToken;
