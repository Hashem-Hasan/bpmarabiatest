const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bpmnRoutes = require('./routes/bpmnroutes');
const authRoutes = require('./routes/auth');
const companyStructureRoutes = require('./routes/companyStructure');
const uploadRoutes = require('./routes/upload'); // Import the upload routes
const employeeRoutes = require('./routes/employee'); // Import the employee routes
const employeeRoutess = require('./routes/employeeRoutes');
const companyRoutes = require('./routes/companyRoutes');

const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // replace with your frontend's URL
  credentials: true,
}));
app.use(bodyParser.json());
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Use routes
app.use('/api/bpmnroutes', bpmnRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/company-structure', companyStructureRoutes);
app.use('/api/upload', uploadRoutes); // Use the upload routes
app.use('/api/employees', employeeRoutes); // Use the employee routes
app.use('/api/employeess', employeeRoutess);
app.use('/api/company', companyRoutes);

// Start the server locally
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app; // Export the app for serverless function
