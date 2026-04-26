const { sql } = require('../db');// Import the sql object from the db module to interact with the database

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function validateName(name) {
    return name && name.trim().length > 0;
}

function validateRole(role) {
    const validRoles = ['manager', 'supervisor', 'staff'];
    return validRoles.includes(role);
}

// Create a new admin
async function createAdmin({ name, email, password, role }) {
    // Validation
    if (!validateEmail(email)) {
        throw new Error('Invalid email format');
    }

    if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters long');
    }

    if (!validateName(name)) {
        throw new Error('Name cannot be empty');
    }

    if (!validateRole(role)) {
        throw new Error('Invalid role. Must be: manager, supervisor, or staff');
    }

    try {
        // Check if admin email already exists
        let request = new sql.Request();// Create a new SQL request object to execute queries against the database
        request.input('email', sql.VarChar(100), email);// Add the email parameter to the SQL request with the appropriate data type and value
        const checkResult = await request.query('SELECT * FROM admins WHERE email = @email');
        // Execute a SQL query to check if an admin with the provided email already exists in the admins table.
        //  The @email parameter is used to prevent SQL injection attacks by safely parameterizing the query.

        if (checkResult.recordset.length > 0) {// If the query returns any records, 
        // it means an admin with that email already exists,
        //  so we throw an error to prevent duplicate entries.
            throw new Error('Admin with this email already exists');
        }

        // Insert new admin
        request = new sql.Request();
        request.input('name', sql.VarChar(100), name);
        request.input('email', sql.VarChar(100), email);
        request.input('password', sql.VarChar(255), password);
        request.input('role', sql.VarChar(50), role);
        
        const insertResult = await request.query(`
            INSERT INTO admins (name, email, password, role, created_at)
            VALUES (@name, @email, @password, @role, GETDATE());
            SELECT SCOPE_IDENTITY() as admin_id;
        `);// Execute a SQL query to insert the new admin into the admins table.
        // The query also retrieves the newly generated admin_id using SCOPE_IDENTITY()
        //  to return it in the response.

        const admin_id = insertResult.recordset[0].admin_id;// 

        return {
            message: 'Admin created successfully',
            token: 'simple-token-admin-' + admin_id,
            admin_id: admin_id,
            name: name,
            email: email,
            role: role
        };
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    }
}

// Get admin by email (without password)
async function getAdminByEmail(email) {
    try {
        let request = new sql.Request();
        request.input('email', sql.VarChar(100), email);
        const result = await request.query('SELECT admin_id, name, email, role, created_at FROM admins WHERE email = @email');

        if (result.recordset.length === 0) {
            throw new Error('Admin not found');
        }

        return result.recordset[0];
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    }
}

// Get admin password by email (for login verification)
async function getAdminPasswordByEmail(email) {
    try {
        let request = new sql.Request();
        request.input('email', sql.VarChar(100), email);
        const result = await request.query('SELECT admin_id, email, password FROM admins WHERE email = @email');

        if (result.recordset.length === 0) {
            throw new Error('Admin not found');
        }

        return result.recordset[0];
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    }
}

module.exports = {
    validateEmail,
    validatePassword,
    validateName,
    validateRole,
    createAdmin,
    getAdminByEmail,
    getAdminPasswordByEmail
};
