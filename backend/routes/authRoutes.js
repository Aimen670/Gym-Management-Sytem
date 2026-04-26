const express = require('express');// use to create apis
const router = express.Router();// create  a router object to define routes 
const { signup, login } = require('../controllers/authController');// import signup and login functions from authController
const { adminSignup, adminLogin } = require('../controllers/adminController');
// import adminSignup and adminLogin functions from adminController

// Member routes
router.post('/signup', signup);//signup is a function in authController that handles user registration. 
router.post('/login', login);

// Admin routes
router.post('/admin-signup', adminSignup);
router.post('/admin-login', adminLogin);

module.exports = router;