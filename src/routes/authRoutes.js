const express = require('express');
const authController = require('../controllers/authController');
const { passport } = require('../middleware/auth');
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Google OAuth endpoints
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: process.env.CLIENT_URL + '/login',
    session: true
}), (req, res) => {
    // Generate JWT for the user
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET || 'changeme',
        { expiresIn: '7d' }
    );
    console.log("Redirecting to:", `${process.env.CLIENT_URL}/oauth-success?token=${token}`);
    // Redirect to frontend with token in query
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
});

module.exports = router; 