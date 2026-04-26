const { sql, getPool } = require('../db');

async function getAdminOverview(req, res) {
    try {
        const pool = getPool();
        const [memberCount, activeCount, trainerCount, planCount, paymentSum] = await Promise.all([
            pool.request().query('SELECT COUNT(*) as total FROM members'),
            pool.request().query("SELECT COUNT(*) as total FROM members WHERE status = 'active'"),
            pool.request().query('SELECT COUNT(*) as total FROM trainers'),
            pool.request().query('SELECT COUNT(*) as total FROM membership_plans'),
            pool.request().query('SELECT ISNULL(SUM(amount), 0) as total FROM payments')
        ]);

        res.json({
            members: memberCount.recordset[0].total,
            activeMembers: activeCount.recordset[0].total,
            trainers: trainerCount.recordset[0].total,
            plans: planCount.recordset[0].total,
            revenue: paymentSum.recordset[0].total
        });
    } catch (err) {
        console.error('Overview error:', err);
        res.status(500).json({ error: 'Failed to load overview' });
    }
}

module.exports = {
    getAdminOverview
};
