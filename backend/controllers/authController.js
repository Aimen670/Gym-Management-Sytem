const { createMember, getMemberByEmail } = require('../models/authModel');

async function signup(req, res) {
    try {
        const { full_name, email, password, phone, age, gender, fitness_goal } = req.body;

        // Validation
        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Full name, email, and password are required' });
        }

        const result = await createMember({
            full_name,
            email,
            password,
            phone: phone || '',
            age: age || 0,
            gender: gender || '',
            fitness_goal: fitness_goal || ''
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('Signup error:', err);
        res.status(400).json({ error: err.message });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await getMemberByEmail(email);

        // Simple password comparison (use bcrypt in production)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Remove password from response
        delete user.password;

        res.status(200).json({
            message: 'Login successful',
            token: 'simple-token-' + user.member_id, // Use JWT in production
            user: user
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(401).json({ error: err.message });
    }
}

module.exports = {
    signup,
    login
};