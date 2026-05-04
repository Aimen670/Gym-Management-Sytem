const { connectToDatabase, sql, getPool } = require('./db');

async function populateSampleData() {
    try {
        // Connect to database first
        await connectToDatabase();
        const pool = getPool();

        console.log('Inserting sample subscriptions...');

        // Insert member subscriptions
        await pool.request().query(`
            INSERT INTO member_subscriptions (member_id, plan_id, start_date, end_date) VALUES
            (1, 1, '2024-12-10', '2025-01-10'), -- Ali Khan - Monthly Plan (expired)
            (2, 2, '2025-02-15', '2025-05-15'), -- Ahmed Raza - Quarterly Plan (active)
            (3, 1, '2024-11-01', '2024-12-01'), -- Fatima Noor - Monthly Plan (expired)
            (4, 1, '2025-02-20', '2025-03-20'), -- Ayesha Malik - Monthly Plan (active)
            (5, 3, '2025-01-05', '2026-01-05')  -- Hassan Ali - Yearly Plan (active)
        `);

        console.log('Inserting sample payments...');

        // Insert payments
        await pool.request().query(`
            INSERT INTO payments (subscription_id, amount, payment_method, payment_date) VALUES
            (1, 5000.00, 'cash', '2025-01-10'), -- Ali Khan payment
            (2, 13000.00, 'card', '2025-02-15'), -- Ahmed Raza payment
            (3, 5000.00, 'online', '2025-03-01'), -- Fatima Noor payment
            (4, 5000.00, 'cash', '2025-02-20'), -- Ayesha Malik payment
            (5, 45000.00, 'card', '2025-01-05')  -- Hassan Ali payment
        `);

        console.log('Sample data populated successfully!');

    } catch (error) {
        console.error('Error populating sample data:', error);
    }
}

// Run if called directly
if (require.main === module) {
    populateSampleData().then(() => process.exit(0));
}

module.exports = { populateSampleData };