const { sql, getPool } = require('../db');

function validateStatus(status) {
    const validStatuses = ['active', 'inactive'];
    return validStatuses.includes(status);
}

async function getAllMembers() {
    const pool = getPool();
    const result = await pool.request().query(
        'SELECT member_id, full_name, email, phone, age, gender, fitness_goal, status, join_date FROM members ORDER BY member_id DESC'
    );
    return result.recordset;
}

async function updateMember(memberId, updates) {
    const {
        full_name,
        email,
        phone,
        age,
        gender,
        fitness_goal,
        status
    } = updates;

    if (status && !validateStatus(status)) {
        throw new Error('Invalid status');
    }

    const pool = getPool();
    const request = pool.request();
    request.input('member_id', sql.Int, memberId);
    request.input('full_name', sql.VarChar(100), full_name || null);
    request.input('email', sql.VarChar(100), email || null);
    request.input('phone', sql.VarChar(20), phone || null);
    request.input('age', sql.Int, age === '' || age === undefined ? null : age);
    request.input('gender', sql.VarChar(10), gender || null);
    request.input('fitness_goal', sql.Text, fitness_goal || null);
    request.input('status', sql.VarChar(20), status || null);

    await request.query(`
        UPDATE members
        SET full_name = COALESCE(@full_name, full_name),
            email = COALESCE(@email, email),
            phone = COALESCE(@phone, phone),
            age = COALESCE(@age, age),
            gender = COALESCE(@gender, gender),
            fitness_goal = COALESCE(@fitness_goal, fitness_goal),
            status = COALESCE(@status, status)
        WHERE member_id = @member_id
    `);

    const result = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query('SELECT member_id, full_name, email, phone, age, gender, fitness_goal, status, join_date FROM members WHERE member_id = @member_id');

    if (result.recordset.length === 0) {
        throw new Error('Member not found');
    }

    return result.recordset[0];
}

module.exports = {
    getAllMembers,
    updateMember
};
