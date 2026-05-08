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
    const pool = getPool();
    
    // ALWAYS check membership status first - this is the most important validation
    const memberPlanCheck = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT TOP 1
                ms.plan_id,
                mp.plan_name,
                mp.duration_months,
                ms.end_date
            FROM member_subscriptions ms
            JOIN membership_plans mp ON ms.plan_id = mp.plan_id
            WHERE ms.member_id = @member_id
              AND ms.end_date >= CAST(GETDATE() AS DATE)
            ORDER BY ms.end_date DESC
        `);

    if (memberPlanCheck.recordset.length === 0) {
        throw new Error('No active subscription found. Please subscribe to a membership plan first.');
    }

    const memberPlan = memberPlanCheck.recordset[0];

    // Check if member has ANY active Quarterly or Yearly plan - this should allow class enrollment
    const premiumPlanCheck = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT TOP 1
                ms.plan_id,
                mp.plan_name,
                mp.duration_months,
                ms.end_date
            FROM member_subscriptions ms
            JOIN membership_plans mp ON ms.plan_id = mp.plan_id
            WHERE ms.member_id = @member_id
              AND ms.end_date >= CAST(GETDATE() AS DATE)
              AND mp.plan_name IN ('Quarterly Plan', 'Yearly Plan')
            ORDER BY ms.start_date DESC
        `);

    const hasActivePremiumPlan = premiumPlanCheck.recordset.length > 0;

    // Check if class exists and get its associated plans
    const classCheck = await pool.request()
        .input('class_id', sql.Int, classId)
        .query(`
            SELECT c.capacity, COUNT(ce.enrollment_id) as enrolled, cp.plan_id as class_plan_id
            FROM classes c
            LEFT JOIN class_enrollments ce ON c.class_id = ce.class_id
            LEFT JOIN class_plans cp ON c.class_id = cp.class_id
            WHERE c.class_id = @class_id
            GROUP BY c.capacity, cp.plan_id
        `);

    if (classCheck.recordset.length === 0) {
        throw new Error('Class not found');
    }

    // Check if member has ONLY monthly plans and no premium plans - block them from class enrollment
    if (!hasActivePremiumPlan && memberPlan.plan_name === 'Monthly Plan') {
        throw new Error('Upgrade your plan to Quarterly or Yearly plan to enroll in group classes.');
    }

    // Check if member's plan allows access to this class
    const classPlans = await pool.request()
        .input('class_id', sql.Int, classId)
        .query('SELECT plan_id FROM class_plans WHERE class_id = @class_id');

    const allowedPlanIds = classPlans.recordset.map(row => row.plan_id);
    
    if (allowedPlanIds.length > 0 && !allowedPlanIds.includes(memberPlan.plan_id)) {
        throw new Error('Your current membership plan does not include access to this class. Please upgrade your plan.');
    }

    const { capacity, enrolled } = classCheck.recordset[0];
    if (capacity && enrolled >= capacity) {
        throw new Error('Class is at full capacity');
    }

    // Check if member is already enrolled (after all membership validations)
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