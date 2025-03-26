const express = require('express');
const { handleRegisterFirstUser, handleRegisterUser, handleRegisterUsingLeftLink, handleRegisterUsingRightLink, handleLoginUser, handleGetSponsorChildrens } = require('../controllers/authController');

const router = express.Router();

// Route to register the first admin user
router.post('/register-admin', handleRegisterFirstUser);
router.post('/register-user', handleRegisterUser);
router.post('/register-user-left', handleRegisterUsingLeftLink);
router.post('/register-user-right', handleRegisterUsingRightLink);
router.post('/login-user', handleLoginUser);
router.get('/getSponsorChildrens/:id', handleGetSponsorChildrens);

module.exports = router;