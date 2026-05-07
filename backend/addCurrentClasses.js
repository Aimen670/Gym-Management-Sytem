const { connectToDatabase } = require('./db');

async function addCurrentClasses() {
    try {
        await connectToDatabase();
        console.log('Connected to database');

        // Use direct SQL with string time format
        const { sql, getPool } = require('./db');
        const pool = getPool();

        const classes = [
            ['Morning Yoga Flow', 2, '2026-05-08', '07:00:00', 20],
            ['HIIT Bootcamp', 3, '2026-05-08', '09:00:00', 15],
            ['Strength & Conditioning', 1, '2026-05-08', '18:00:00', 12],
            ['Evening Pilates', 4, '2026-05-09', '17:00:00', 18],
            ['Cardio Blast', 3, '2026-05-09', '08:00:00', 25],
            ['Power Yoga', 2, '2026-05-10', '07:30:00', 20],
            ['Functional Training', 1, '2026-05-10', '19:00:00', 15],
            ['Weekend Yoga Workshop', 2, '2026-05-11', '10:00:00', 25]
        ];

        console.log('Inserting current classes using direct SQL...');
        
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

        console.log('\n✅ All current classes inserted successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

addCurrentClasses();
