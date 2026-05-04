const { sql, getPool } = require('../db');

async function getPayments() {
    const pool = getPool();
    const result = await pool.request().query(`
        SELECT 
            p.payment_id, 
            p.subscription_id, 
            p.amount, 
            p.payment_method, 
            p.payment_date,
            m.full_name as member_name,
            mp.plan_name,
            mp.price as plan_price
        FROM payments p
        JOIN member_subscriptions ms ON p.subscription_id = ms.subscription_id
        JOIN members m ON ms.member_id = m.member_id
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id
        ORDER BY p.payment_date DESC, p.payment_id DESC
    `);
    return result.recordset;
}

async function getPendingPayments() {
    const pool = getPool();
    const result = await pool.request().query(`
        SELECT 
            ms.subscription_id,
            m.full_name as member_name,
            m.email,
            mp.plan_name,
            mp.price,
            ms.start_date,
            ms.end_date,
            DATEDIFF(day, GETDATE(), ms.end_date) as days_remaining,
            CASE 
                WHEN GETDATE() > ms.end_date THEN 'overdue'
                WHEN DATEDIFF(day, GETDATE(), ms.end_date) <= 7 THEN 'due_soon'
                ELSE 'active'
            END as status
        FROM member_subscriptions ms
        JOIN members m ON ms.member_id = m.member_id
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id
        LEFT JOIN payments p ON ms.subscription_id = p.subscription_id
        WHERE p.payment_id IS NULL 
           OR (ms.end_date < GETDATE() AND NOT EXISTS (
               SELECT 1 FROM payments p2 
               WHERE p2.subscription_id = ms.subscription_id 
               AND p2.payment_date >= DATEADD(month, -1, ms.end_date)
           ))
        ORDER BY ms.end_date ASC
    `);
    return result.recordset;
}

async function getRevenueReport() {
    const pool = getPool();
    const monthlyResult = await pool.request().query(`
        SELECT 
            YEAR(payment_date) as year,
            MONTH(payment_date) as month,
            SUM(amount) as total_revenue,
            COUNT(*) as transaction_count
        FROM payments 
        WHERE payment_date >= DATEADD(month, -12, GETDATE())
        GROUP BY YEAR(payment_date), MONTH(payment_date)
        ORDER BY year DESC, month DESC
    `);

    const totalResult = await pool.request().query(`
        SELECT 
            SUM(amount) as total_revenue,
            COUNT(*) as total_transactions,
            AVG(amount) as avg_transaction
        FROM payments
    `);

    const methodResult = await pool.request().query(`
        SELECT 
            payment_method,
            SUM(amount) as total_amount,
            COUNT(*) as transaction_count
        FROM payments 
        GROUP BY payment_method
        ORDER BY total_amount DESC
    `);

    return {
        monthly: monthlyResult.recordset,
        totals: totalResult.recordset[0],
        byMethod: methodResult.recordset
    };
}

async function getAllSubscriptions() {
    const pool = getPool();
    const result = await pool.request().query(`
        SELECT 
            ms.subscription_id,
            m.full_name as member_name,
            m.email,
            mp.plan_name,
            mp.price,
            ms.start_date,
            ms.end_date,
            CASE 
                WHEN GETDATE() > ms.end_date THEN 'expired'
                ELSE 'active'
            END as subscription_status
        FROM member_subscriptions ms
        JOIN members m ON ms.member_id = m.member_id
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id
        ORDER BY ms.subscription_id DESC
    `);
    return result.recordset;
}

async function createPayment(payment) {
    const { member_email, subscription_id, amount, payment_method } = payment;

    if ((!member_email && !subscription_id) || !amount || !payment_method) {
        throw new Error('Subscription, amount, and payment method are required');
    }

    const pool = getPool();
    let subscriptionId = subscription_id;

    if (!subscriptionId) {
        // Find member by email and resolve their latest subscription
        const memberResult = await pool.request()
            .input('email', sql.VarChar(100), member_email)
            .query('SELECT member_id FROM members WHERE email = @email');

        if (memberResult.recordset.length === 0) {
            throw new Error('Member not found');
        }

        const member_id = memberResult.recordset[0].member_id;
        const subResult = await pool.request()
            .input('member_id', sql.Int, member_id)
            .query(`
                SELECT TOP 1 ms.subscription_id, mp.price
                FROM member_subscriptions ms
                JOIN membership_plans mp ON ms.plan_id = mp.plan_id
                WHERE ms.member_id = @member_id
                ORDER BY ms.start_date DESC
            `);

        if (subResult.recordset.length === 0) {
            throw new Error('No active subscription found for this member');
        }

        subscriptionId = subResult.recordset[0].subscription_id;
    } else {
        const subResult = await pool.request()
            .input('subscription_id', sql.Int, parseInt(subscriptionId, 10))
            .query(`
                SELECT ms.subscription_id
                FROM member_subscriptions ms
                WHERE ms.subscription_id = @subscription_id
            `);

        if (subResult.recordset.length === 0) {
            throw new Error('Subscription not found');
        }

        subscriptionId = subResult.recordset[0].subscription_id;
    }

    const request = pool.request();
    request.input('subscription_id', sql.Int, subscriptionId);
    request.input('amount', sql.Decimal(10, 2), amount);
    request.input('payment_method', sql.VarChar(50), payment_method);

    const insertResult = await request.query(`
        INSERT INTO payments (subscription_id, amount, payment_method, payment_date)
        VALUES (@subscription_id, @amount, @payment_method, GETDATE());
        SELECT SCOPE_IDENTITY() as payment_id;
    `);

    return {
        payment_id: insertResult.recordset[0].payment_id,
        subscription_id,
        amount,
        payment_method,
        payment_date: new Date().toISOString()
    };
}

module.exports = {
    getPayments,
    createPayment,
    getPendingPayments,
    getRevenueReport,
    getAllSubscriptions
};
