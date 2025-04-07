/**
 * auth.js
 * Authentication middleware
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - middleware that requires valid JWT token
 */
exports.protect = async (req, res, next) => {
    let token;
    
    // Check Authorization header for token
    if (
        req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Get token from header (format: "Bearer <token>")
        token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this resource'
        });
    }
    
    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user ID to request
        req.user = {
            id: decoded.id
        };
        
        // Add full user object if needed in the future
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found with this token'
            });
        }
        
        // Pass to next middleware
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this resource'
        });
    }
};

/**
 * Check if user has admin role
 */
exports.isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required for this resource'
        });
    }
    
    next();
};