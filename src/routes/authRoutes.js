const express = require('express');
const { handleRegisterFirstUser, handleRegisterUser } = require('../controllers/authController');

const router = express.Router();

// Route to register the first admin user
router.post('/register-admin', handleRegisterFirstUser);
router.post('/register-user', handleRegisterUser);

module.exports = router;