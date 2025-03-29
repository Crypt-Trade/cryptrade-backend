const express = require('express');
const {handleGetAllReferrals} = require ("../controllers/userController")
const router = express.Router();
router.post('/directreffers', handleGetAllReferrals);




module.exports = router;