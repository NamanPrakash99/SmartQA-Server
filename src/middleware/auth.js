const jwt = require('jsonwebtoken');
const User = require('../models/User');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Attach user to req.user if valid
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided');
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded JWT:', decoded);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            console.log('User not found for id:', decoded.id);
            return res.status(401).json({ message: 'User not found' });
        }
        next();
    } catch (err) {
        console.log('Invalid token:', err.message);
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Usage: requireRole('admin') or requireRole(['host','admin'])
const requireRole = (roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Try to find user by Google ID
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            // Try to find user by email
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
                // Link Google ID to existing user
                user.googleId = profile.id;
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    role: 'user',
                });
            }
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = { requireAuth, requireRole, passport }; 