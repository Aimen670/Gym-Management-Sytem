const { sql, getPool } = require('../db');

async function getPlans() {
    const pool = getPool();
    const result = await pool.request().query(
        'SELECT plan_id, plan_name, duration_months, price, description FROM membership_plans ORDER BY plan_id DESC'
    );
    return result.recordset;
}

async function createPlan(plan) {
    const { plan_name, duration_months, price, description } = plan;

    if (!plan_name) {
        throw new Error('Plan name is required');
    }

    const pool = getPool();
    const request = pool.request();
    request.input('plan_name', sql.VarChar(50), plan_name);
    request.input('duration_months', sql.Int, duration_months || null);
    request.input('price', sql.Decimal(10, 2), price || null);
    request.input('description', sql.Text, description || null);

    const insertResult = await request.query(`
        INSERT INTO membership_plans (plan_name, duration_months, price, description)
        VALUES (@plan_name, @duration_months, @price, @description);
        SELECT SCOPE_IDENTITY() as plan_id;
    `);

    return {
        plan_id: insertResult.recordset[0].plan_id,
        plan_name,
        duration_months: duration_months || null,
        price: price || null,
        description: description || null
    };
}

async function updatePlan(planId, plan) {
    const { plan_name, duration_months, price, description } = plan;

    if (!plan_name) {
        throw new Error('Plan name is required');
    }

    const pool = getPool();
    const request = pool.request();
    request.input('plan_id', sql.Int, planId);
    request.input('plan_name', sql.VarChar(50), plan_name);
    request.input('duration_months', sql.Int, duration_months || null);
    request.input('price', sql.Decimal(10, 2), price || null);
    request.input('description', sql.Text, description || null);

    await request.query(`
        UPDATE membership_plans
        SET plan_name = @plan_name,
            duration_months = @duration_months,
            price = @price,
            description = @description
        WHERE plan_id = @plan_id
    `);

    const result = await pool.request()
        .input('plan_id', sql.Int, planId)
        .query('SELECT plan_id, plan_name, duration_months, price, description FROM membership_plans WHERE plan_id = @plan_id');

    if (result.recordset.length === 0) {
        throw new Error('Plan not found');
    }

    return result.recordset[0];
}

async function deletePlan(planId) {
    const pool = getPool();
    const result = await pool.request()
        .input('plan_id', sql.Int, planId)
        .query('DELETE FROM membership_plans WHERE plan_id = @plan_id');

    if (result.rowsAffected[0] === 0) {
        throw new Error('Plan not found');
    }

    return { success: true };
}

module.exports = {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan
};
