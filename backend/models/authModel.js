const { sql } = require('../db');

async function createMember(memberData) {
    try {
        const { full_name, email, password, phone, age, gender, fitness_goal } = memberData;
        
        // Check if email already exists
        const checkEmail = await sql.query(
            `SELECT email FROM members WHERE email = '${email}'`
        );
        
        if (checkEmail.recordset.length > 0) {
            throw new Error('Email already registered');
        }

        // Check if phone already exists
        if (phone) {
            const checkPhone = await sql.query(
                `SELECT phone FROM members WHERE phone = '${phone}'`
            );
            if (checkPhone.recordset.length > 0) {
                throw new Error('Phone number already registered');
            }
        }

        const query = `
            INSERT INTO members (full_name, email, password, phone, age, gender, fitness_goal)
            VALUES ('${full_name}', '${email}', '${password}', '${phone}', ${age}, '${gender}', '${fitness_goal}')
        `;

        await sql.query(query);
        return { success: true, message: 'Account created successfully' };
    } catch (err) {
        console.error('Signup error:', err);
        throw err;
    }
}

async function getMemberByEmail(email) {
    try {
        const result = await sql.query(
            `SELECT member_id, full_name, email, password, phone, age, gender FROM members WHERE email = '${email}'`
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
    getMemberByEmail
};