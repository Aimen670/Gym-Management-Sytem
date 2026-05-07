const { connectToDatabase } = require('./db');

async function addClassesViaAPI() {
    try {
        await connectToDatabase();
        console.log('Connected to database');

        // Use direct SQL with string time format
        const { sql, getPool } = require('./db');
        const pool = getPool();

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

        console.log('Inserting classes using direct SQL...');
        
        for (const [class_name, trainer_id, schedule_date, schedule_time, capacity] of classes) {
            try {
                const result = await pool.request()
                    .input('class_name', sql.VarChar(100), class_name)
                    .input('trainer_id', sql.Int, trainer_id)
                    .input('schedule_date', sql.Date, schedule_date)
                    .input('schedule_time', sql.VarChar(8), schedule_time) // Use VarChar instead of Time
                    .input('capacity', sql.Int, capacity)
                    .query(`
                        INSERT INTO classes (class_name, trainer_id, schedule_date, schedule_time, capacity)
                        VALUES (@class_name, @trainer_id, @schedule_date, CAST(@schedule_time AS TIME), @capacity);
                        SELECT SCOPE_IDENTITY() as class_id;
                    `);
                
                const classId = result.recordset[0].class_id;
                console.log(`✓ Created class: ${class_name} (ID: ${classId})`);
                
                // Link to membership plans
                await pool.request()
                    .input('class_id', sql.Int, classId)
                    .query(`
                        INSERT INTO class_plans (class_id, plan_id)
                        SELECT @class_id, plan_id FROM membership_plans WHERE plan_id IN (2, 3)
                    `);
                
            } catch (error) {
                console.log(`✗ Failed to create ${class_name}: ${error.message}`);
            }
        }

        // Add sample enrollments for existing classes
        console.log('\nAdding sample enrollments...');
        const enrollmentData = [
            [1, 1], [1, 2], // Class 1
            [2, 3], [2, 4], // Class 2
            [3, 5], // Class 3
            [4, 1], [4, 2], // Class 4
            [5, 3], [5, 4], [5, 5] // Class 5
        ];

        for (const [class_id, member_id] of enrollmentData) {
            try {
                await pool.request()
                    .input('class_id', sql.Int, class_id)
                    .input('member_id', sql.Int, member_id)
                    .query(`
                        IF NOT EXISTS (SELECT 1 FROM class_enrollments WHERE class_id = @class_id AND member_id = @member_id)
                        INSERT INTO class_enrollments (class_id, member_id) VALUES (@class_id, @member_id)
                    `);
                
                console.log(`✓ Enrolled member ${member_id} in class ${class_id}`);
            } catch (error) {
                console.log(`✗ Failed to enroll member ${member_id} in class ${class_id}: ${error.message}`);
            }
        }

        console.log('\n✅ All test data inserted successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

addClassesViaAPI();
