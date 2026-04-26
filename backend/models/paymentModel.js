const { sql, getPool } = require('../db');

async function getPayments() {
    const pool = getPool();
    const result = await pool.request().query(
        'SELECT payment_id, subscription_id, amount, payment_method, payment_date FROM payments ORDER BY payment_id DESC'
    );
    return result.recordset;
}

async function createPayment(payment) {
    const { subscription_id, amount, payment_method } = payment;

    if (!subscription_id || !amount || !payment_method) {
        throw new Error('Subscription, amount, and payment method are required');
    }

    const pool = getPool();
    const request = pool.request();
    request.input('subscription_id', sql.Int, subscription_id);
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
    createPayment
};
