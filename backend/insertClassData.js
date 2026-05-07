const { sql, getPool } = require('./db');

async function insertClassTestData() {
    try {
        const pool = getPool();
        
        // Sample classes with proper time format
        const classes = [
            ['Morning Yoga Flow', 2, '2025-06-15', '07:00:00', 20],
            ['HIIT Bootcamp', 3, '2025-06-15', '09:00:00', 15],
            ['Strength & Conditioning', 1, '2025-06-15', '18:00:00', 12],
            ['Evening Pilates', 4, '2025-06-16', '17:00:00', 18],
            ['Cardio Blast', 3, '2025-06-16', '08:00:00', 25],
            ['Power Yoga', 2, '2025-06-17', '07:30:00', 20],
            ['Functional Training', 1, '2025-06-17', '19:00:00', 15],
            ['Weekend Yoga Workshop', 2, '2025-06-18', '10:00:00', 25]
        ];

        console.log('Inserting sample classes...');
        
        for (const [class_name, trainer_id, schedule_date, schedule_time, capacity] of classes) {
            try {
                const result = await pool.request()
                    .input('class_name', sql.VarChar(100), class_name)
                    .input('trainer_id', sql.Int, trainer_id)
                    .input('schedule_date', sql.Date, schedule_date)
                    .input('schedule_time', sql.Time, schedule_time)
                    .input('capacity', sql.Int, capacity)
                    .query(`
                        INSERT INTO classes (class_name, trainer_id, schedule_date, schedule_time, capacity)
                        VALUES (@class_name, @trainer_id, @schedule_date, @schedule_time, @capacity);
                        SELECT SCOPE_IDENTITY() as class_id;
                    `);
                
                const classId = result.recordset[0].class_id;
                console.log(`✓ Created class: ${class_name} (ID: ${classId})`);
                
                // Link to membership plans (Quarterly and Yearly)
                await pool.request()
                    .input('class_id', sql.Int, classId)
                    .input('plan_id', sql.Int, 2)
                    .query('INSERT INTO class_plans (class_id, plan_id) VALUES (@class_id, @plan_id)');
                
                await pool.request()
                    .input('class_id', sql.Int, classId)
                    .input('plan_id', sql.Int, 3)
                    .query('INSERT INTO class_plans (class_id, plan_id) VALUES (@class_id, @plan_id)');
                
            } catch (error) {
                console.log(`✗ Failed to create ${class_name}: ${error.message}`);
            }
        }

        // Add some sample enrollments
        console.log('\nAdding sample enrollments...');
        const enrollments = [
            [1, 1], [1, 2], // Morning Yoga Flow - Ali Khan, Ahmed Raza
            [2, 3], [2, 4], // HIIT Bootcamp - Fatima Noor, Ayesha Malik  
            [3, 5], // Strength & Conditioning - Hassan Ali
            [4, 1], [4, 2], // Evening Pilates - Ali Khan, Ahmed Raza
            [5, 3], [5, 4], [5, 5] // Cardio Blast - Fatima Noor, Ayesha Malik, Hassan Ali
        ];

        for (const [class_id, member_id] of enrollments) {
            try {
                await pool.request()
                    .input('class_id', sql.Int, class_id)
                    .input('member_id', sql.Int, member_id)
                    .query('INSERT INTO class_enrollments (class_id, member_id) VALUES (@class_id, @member_id)');
                
                console.log(`✓ Enrolled member ${member_id} in class ${class_id}`);
            } catch (error) {
                console.log(`✗ Failed to enroll member ${member_id} in class ${class_id}: ${error.message}`);
            }
        }

        console.log('\n✅ Class test data insertion completed successfully!');

    } catch (error) {
        console.error('Error inserting test data:', error);
    } finally {
        process.exit(0);
    }
}

// Connect and run
require('./db').connectToDatabase().then(() => {
    insertClassTestData();
}).catch(error => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
});
