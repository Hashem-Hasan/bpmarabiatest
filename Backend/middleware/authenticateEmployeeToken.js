const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY || 'your_secret_key_here';

const authenticateEmployeeToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log('Access Denied: No Token Provided');
    return res.status(401).send({ message: 'Access Denied' });
  }

  try {
    console.log('Token to verify:', token);
    const verified = jwt.verify(token, secretKey);
    req.employee = verified;
    console.log('Token Verified:', verified);
    next();
  } catch (error) {
    console.log('Invalid Token:', error);
    res.status(400).send({ message: 'Invalid Token' });
  }
};

module.exports = authenticateEmployeeToken;
