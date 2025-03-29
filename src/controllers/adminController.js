const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');

// Admin Registration
async function registerAdmin(req, res) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide both email and password' });
        }

        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create new admin
        const newAdmin = await Admin.create({ email, password });

        res.status(201).json({ message: 'Admin registered successfully', admin: newAdmin });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Admin Login
async function loginAdmin(req, res) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find the admin in the database
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Compare password
        const isPasswordMatch = await admin.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Incorrect email or password' });
        }

        // Generate and return token
        const token = generateToken({ id: admin._id, email: admin.email, role: 'admin' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


module.exports = {
    registerAdmin,
    loginAdmin
};