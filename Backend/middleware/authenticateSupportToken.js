// authenticateSupportToken.js
const jwt = require('jsonwebtoken');
const Support = require('../models/Support');

const authenticateSupportToken = async (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');

  if (!token) {
    return res.status(401).send({ error: 'Authentication required' });
  }

  try {
    const data = jwt.verify(token, 'your_secret_key_here');
    const support = await Support.findById(data._id);

    if (!support) {
      console.error('Support not found for the provided token');
      return res.status(401).send({ error: 'Invalid token' });
    }

    req.supportId = support._id;
    req.support = support;
    next();
  } catch (error) {
    console.error('Token verification failed', error);
    res.status(401).send({ error: 'Invalid token' });
  }
};

module.exports = authenticateSupportToken;
