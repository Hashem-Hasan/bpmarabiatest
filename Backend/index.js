const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Importing route files
const bpmnRoutes = require('./routes/bpmnroutes');
const authRoutes = require('./routes/auth');
const companyStructureRoutes = require('./routes/companyStructure');
const departmentStructureRoutes = require('./routes/departmentStructure'); // Import department structure routes
const employeeRoutes = require('./routes/employee');
const employeeRoutess = require('./routes/employeeRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/admin'); // Import admin routes
const departmentWithProcessesRoutes = require('./routes/departments'); // Import departments-with-processes routes


const app = express();
const port = process.env.PORT || 3001;

// Middleware setup
const allowedOrigins = [process.env.FRONTEND_URL, 'https://management.bpmarabia.app', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('Error connecting to MongoDB:', error));

// Routes
app.use('/api/bpmnroutes', bpmnRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/company-structure', companyStructureRoutes);
app.use('/api/department-structure', departmentStructureRoutes); // Use department structure routes
app.use('/api/employees', employeeRoutes);
app.use('/api/employeess', employeeRoutess);
app.use('/api/company', companyRoutes);
app.use('/api/admin', adminRoutes); // Use the new admin routes
app.use('/api/departments', departmentWithProcessesRoutes); // Use the departments-with-processes route


// Start the server locally
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

module.exports = app; // Export the app for serverless function
