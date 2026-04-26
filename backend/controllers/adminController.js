const { createAdmin, getAdminByEmail, getAdminPasswordByEmail } = require('../models/adminModel');
// import functions from adminModel to handle admin-related database operations

async function adminSignup(req, res) {
    try {
        const { name, email, password, role } = req.body;// extract from the request body

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required' });
        }//400 means bad req

        const result = await createAdmin({
            name,
            email,
            password,
            role
        });

        res.status(201).json(result);//201 means created successfully and send the result as JSON response to the client 
    } catch (err) {
        console.error('Admin signup error:', err);
        const statusCode = err.message.includes('already') ? 409 : 400;
        res.status(statusCode).json({ error: err.message });//409 means conflict (e.g., email already exists), otherwise 400 for other validation errors
    }
}

async function adminLogin(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Get admin with password 
        const adminWithPassword = await getAdminPasswordByEmail(email);
        // retrieve the admin's password hash from the database using the provided email for login verification

        // Simple password comparison 
        if (adminWithPassword.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });//401 means unauthorized (invalid credentials)
        }

        // Get admin info without password
        const admin = await getAdminByEmail(email);

        res.status(200).json({
            message: 'Admin login successful',
            token: 'simple-token-admin-' + admin.admin_id, //tokes is used   here we return a simple token for demonstration purposes
            admin: admin
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(401).json({ error: err.message });
    }
}

module.exports = {// export the adminSignup and adminLogin functions to be used in routes
    adminSignup,
    adminLogin
};
