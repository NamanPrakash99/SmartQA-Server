const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const authController = {
    // POST /auth/signup
    signup: async (req, res) => {
        try {
            const { name, email, password, role } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ message: 'All fields are required' });
            }
            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(409).json({ message: 'Email already in use' });
            }
            const hashed = await bcrypt.hash(password, 10);
            const user = await User.create({
                name,
                email,
                password: hashed,
                role: role || 'user',
            });
            const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            res.json({
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                token
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    // POST /auth/login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password required' });
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            res.json({
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                token
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
};

module.exports = authController; 