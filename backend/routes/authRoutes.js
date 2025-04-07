/**
 * authRoutes.js
 * Routes for user authentication
 */
const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getProfile, 
    validateToken, 
    logout 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', protect, getProfile);
router.get('/validate', protect, validateToken);

module.exports = router;