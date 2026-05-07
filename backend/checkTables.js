const { connectToDatabase, getPool, sql } = require('./db');

async function checkTables() {
    try {
        await connectToDatabase();
        const pool = getPool();
        
        console.log('Checking existing tables...');
        
        // Check all required tables
        const tables = [
            'members',
            'admins', 
            'trainers',
            'membership_plans',
            'member_subscriptions',
            'payments',
            'trainer_sessions',
            'trainer_availability',
            'workout_plans',
            'exercises',
            'workout_plan_exercises',
            'workout_logs',
            'diet_plans',
            'body_measurements',
            'fitness_goals',
            'classes',
            'class_plans',
            'class_enrollments',
            'equipment',
            'equipment_maintenance'
        ];
        
        for (const table of tables) {
            try {
                const result = await pool.request()
                    .input('tableName', sql.VarChar(100), table)
                    .query(`
                        SELECT COUNT(*) as count 
                        FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLE_NAME = @tableName
                    `);
                
                const exists = result.recordset[0].count > 0;
                console.log(`${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
                
                if (exists && table === 'exercises') {
                    const countResult = await pool.request().query('SELECT COUNT(*) as count FROM exercises');
                    console.log(`  - Exercises count: ${countResult.recordset[0].count}`);
                }
            } catch (error) {
                console.log(`${table}: ERROR - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Error checking tables:', error);
        throw error;
    }
}

// Run the script
checkTables()
    .then(() => {
        console.log('Table check completed');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Table check failed:', err);
        process.exit(1);
    });
