const { createAdmin, getAdminByEmail, getAdminPasswordByEmail } = require('../models/adminModel');

async function adminSignup(req, res) {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required' });
        }

        const result = await createAdmin({
            name,
            email,
            password,
            role
        });

        res.status(201).json(result);
    } catch (err) {
        console.error('Admin signup error:', err);
        const statusCode = err.message.includes('already') ? 409 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

async function adminLogin(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get admin with password hash
        const adminWithPassword = await getAdminPasswordByEmail(email);

        // Simple password comparison (use bcrypt in production)
        if (adminWithPassword.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get admin info without password
        const admin = await getAdminByEmail(email);

        res.status(200).json({
            message: 'Admin login successful',
            token: 'simple-token-admin-' + admin.admin_id, // Use JWT in production
            admin: admin
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(401).json({ error: err.message });
    }
}

module.exports = {
    adminSignup,
    adminLogin
};
