const { createMember, getMemberByEmail, getMemberPasswordByEmail } = require('../models/authModel');

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
            phone: phone || null,
            age: age || null,
            gender: gender || null,
            fitness_goal: fitness_goal || null
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('Signup error:', err);
        const statusCode = err.message.includes('already') ? 409 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get user with password hash
        const userWithPassword = await getMemberPasswordByEmail(email);

        // Simple password comparison (use bcrypt in production)
        if (userWithPassword.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get user info without password
        const user = await getMemberByEmail(email);

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