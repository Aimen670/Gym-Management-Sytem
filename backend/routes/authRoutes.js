const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const { adminSignup, adminLogin } = require('../controllers/adminController');

// Member routes
router.post('/signup', signup);
router.post('/login', login);

// Admin routes
router.post('/admin-signup', adminSignup);
router.post('/admin-login', adminLogin);

module.exports = router;