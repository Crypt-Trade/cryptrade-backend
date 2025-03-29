const express = require('express');
const { handleRegisterFirstUser, handleRegisterUser, handleRegisterUsingLeftLink, handleRegisterUsingRightLink, handleLoginUser, handleGetSponsorChildrens  , handleVerifySponsor , handleExtremeRight , handleExtremeLeft} = require('../controllers/authController');

const router = express.Router();

// Route to register the first admin user
router.post('/register-admin', handleRegisterFirstUser);
router.post('/register-user', handleRegisterUser);
router.post('/register-user-left', handleRegisterUsingLeftLink);
router.post('/register-user-right', handleRegisterUsingRightLink);
router.post('/login-user', handleLoginUser);
router.get('/getSponsorChildrens/:id', handleGetSponsorChildrens);
router.post('/verify-sponsor' , handleVerifySponsor);
router.post('/extremeLeft', handleExtremeLeft);
router.post('/extremeRight', handleExtremeRight);

module.exports = router;