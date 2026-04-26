const { sql, getPool } = require('../db');

// Validation helper functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    // Exactly 11 digits, no special characters
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone);
}

function validateAge(age) {
    const ageNum = parseInt(age);
    return ageNum > 0 && ageNum <= 100;
}

function validateGender(gender) {
    const validGenders = ['male', 'female', 'other'];
    return validGenders.includes(gender.toLowerCase());
}

function validatePassword(password) {
    return password && password.length >= 6;
}

async function createMember(memberData) {
    try {
        const { full_name, email, password, phone, age, gender, fitness_goal } = memberData;

        // Validate required fields
        if (!full_name || !email || !password) {
            throw new Error('Full name, email, and password are required');
        }

        // Validate email format
        if (!validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        // Validate password length
        if (!validatePassword(password)) {
            throw new Error('Password must be at least 6 characters long');
        }

        // Validate phone if provided
        if (phone && !validatePhone(phone)) {
            throw new Error('Phone must be exactly 11 digits (numeric only)');
        }

        // Validate age if provided
        if (age && !validateAge(age)) {
            throw new Error('Age must be between 1 and 100');
        }

        // Validate gender if provided
        if (gender && !validateGender(gender)) {
            throw new Error('Gender must be one of: male, female, other');
        }

        // Check if email already exists
        const pool = getPool();
        let request = pool.request();
        request.input('email', sql.VarChar(100), email);
        const checkEmail = await request.query(
            `SELECT email FROM members WHERE email = @email`
        );

        if (checkEmail.recordset.length > 0) {
            throw new Error('Email already registered');
        }

        // Check if phone already exists
        if (phone) {
            request = pool.request();
            request.input('phone', sql.VarChar(20), phone);
            const checkPhone = await request.query(
                `SELECT phone FROM members WHERE phone = @phone`
            );
            if (checkPhone.recordset.length > 0) {
                throw new Error('Phone number already registered');
            }
        }

        // Insert member using parameterized query
        request = pool.request();
        request.input('full_name', sql.VarChar(100), full_name);
        request.input('email', sql.VarChar(100), email);
        request.input('password', sql.VarChar(255), password);
        request.input('phone', sql.VarChar(20), phone || null);
        request.input('age', sql.Int, age ? parseInt(age) : null);
        request.input('gender', sql.VarChar(10), gender ? gender.toLowerCase() : null);
        request.input('fitness_goal', sql.Text, fitness_goal || null);

        const insertQuery = `
            INSERT INTO members (full_name, email, password, phone, age, gender, fitness_goal, status)
            VALUES (@full_name, @email, @password, @phone, @age, @gender, @fitness_goal, 'active')
        `;

        await request.query(insertQuery);
        return { success: true, message: 'Account created successfully' };
    } catch (err) {
        console.error('Signup error:', err);
        throw err;
    }
}

async function getMemberByEmail(email) {
    try {
        // Validate email format
        if (!validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        const pool = getPool();
        const request = pool.request();
        request.input('email', sql.VarChar(100), email);

        const result = await request.query(
            `SELECT member_id, full_name, email, phone, age, gender FROM members WHERE email = @email`
        );

        if (result.recordset.length === 0) {
            throw new Error('User not found');
        }

        return result.recordset[0];
    } catch (err) {
        console.error('Query error:', err);
        throw err;
    }
}

async function getMemberPasswordByEmail(email) {
    try {
        if (!validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        const pool = getPool();
        const request = pool.request();
        request.input('email', sql.VarChar(100), email);

        const result = await request.query(
            `SELECT member_id, password FROM members WHERE email = @email`
        );

        if (result.recordset.length === 0) {
            throw new Error('User not found');
        }

        return result.recordset[0];
    } catch (err) {
        console.error('Query error:', err);
        throw err;
    }
}

module.exports = {
    createMember,
    getMemberByEmail,
    getMemberPasswordByEmail,
    validateEmail,
    validatePhone,
    validateAge,
    validateGender,
    validatePassword
};