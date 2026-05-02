const { sql, getPool } = require('../db');

async function getClassEnrollments(classId) {
    const pool = getPool();
    const result = await pool.request()
        .input('class_id', sql.Int, classId)
        .query(`
            SELECT ce.enrollment_id, ce.class_id, ce.member_id, m.full_name, m.email
            FROM class_enrollments ce
            JOIN members m ON ce.member_id = m.member_id
            WHERE ce.class_id = @class_id
            ORDER BY ce.enrollment_id DESC
        `);
    return result.recordset;
}

async function enrollMember(classId, memberId) {
    // Check if class exists and has capacity
    const pool = getPool();
    const classCheck = await pool.request()
        .input('class_id', sql.Int, classId)
        .query(`
            SELECT capacity, COUNT(ce.enrollment_id) as enrolled
            FROM classes c
            LEFT JOIN class_enrollments ce ON c.class_id = ce.class_id
            WHERE c.class_id = @class_id
            GROUP BY c.capacity
        `);

    if (classCheck.recordset.length === 0) {
        throw new Error('Class not found');
    }

    const { capacity, enrolled } = classCheck.recordset[0];
    if (capacity && enrolled >= capacity) {
        throw new Error('Class is at full capacity');
    }

    // Check if member is already enrolled
    const existing = await pool.request()
        .input('class_id', sql.Int, classId)
        .input('member_id', sql.Int, memberId)
        .query('SELECT enrollment_id FROM class_enrollments WHERE class_id = @class_id AND member_id = @member_id');

    if (existing.recordset.length > 0) {
        throw new Error('Member is already enrolled in this class');
    }

    // Enroll the member
    const result = await pool.request()
        .input('class_id', sql.Int, classId)
        .input('member_id', sql.Int, memberId)
        .query(`
            INSERT INTO class_enrollments (class_id, member_id)
            VALUES (@class_id, @member_id);
            SELECT SCOPE_IDENTITY() as enrollment_id;
        `);

    return { enrollment_id: result.recordset[0].enrollment_id };
}

async function unenrollMember(enrollmentId) {
    const pool = getPool();
    const result = await pool.request()
        .input('enrollment_id', sql.Int, enrollmentId)
        .query('DELETE FROM class_enrollments WHERE enrollment_id = @enrollment_id');

    if (result.rowsAffected[0] === 0) {
        throw new Error('Enrollment not found');
    }

    return { success: true };
}

module.exports = {
    getClassEnrollments,
    enrollMember,
    unenrollMember
};