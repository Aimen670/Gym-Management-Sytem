const { connectToDatabase } = require('./db');

async function testAvatarSystemSimple() {
    try {
        console.log('Testing Avatar System (Simple)...');
        
        const pool = await connectToDatabase();
        
        // Test 1: Check current avatar state
        console.log('\n1. Checking current avatar state for member 1...');
        const currentAvatarResult = await pool.request()
            .input('member_id', 1)
            .query('SELECT * FROM member_avatars WHERE member_id = @member_id');
        
        console.log('Current avatar:', currentAvatarResult.recordset[0]);
        
        // Test 2: Create a workout log without OUTPUT clause
        console.log('\n2. Creating test workout log...');
        await pool.request().query(`
            INSERT INTO workout_logs (member_id, workout_plan_id, exercise_id, weight_used, reps_completed, log_date)
            VALUES (1, 1, 1, 50, 10, GETDATE())
        `);
        console.log('✅ Workout log created');
        
        // Test 3: Check avatar after workout
        console.log('\n3. Checking avatar after workout...');
        const avatarAfterWorkout = await pool.request()
            .input('member_id', 1)
            .query('SELECT * FROM member_avatars WHERE member_id = @member_id');
        
        console.log('Avatar after workout:', avatarAfterWorkout.recordset[0]);
        
        // Test 4: Check progress log
        console.log('\n4. Checking progress log...');
        const progressLog = await pool.request()
            .input('member_id', 1)
            .query(`
                SELECT TOP 3 * FROM avatar_progress_log 
                WHERE member_id = @member_id 
                ORDER BY created_at DESC
            `);
        
        console.log('Recent progress:', progressLog.recordset);
        
        // Test 5: Create body measurement to test measurement trigger
        console.log('\n5. Creating test body measurement...');
        await pool.request().query(`
            INSERT INTO body_measurements (member_id, weight, bmi, body_fat, muscle_mass, record_date)
            VALUES (1, 75.5, 24.5, 18.2, 35.8, GETDATE())
        `);
        console.log('✅ Body measurement created');
        
        // Test 6: Check avatar after measurement
        console.log('\n6. Checking avatar after measurement...');
        const avatarAfterMeasurement = await pool.request()
            .input('member_id', 1)
            .query('SELECT * FROM member_avatars WHERE member_id = @member_id');
        
        console.log('Avatar after measurement:', avatarAfterMeasurement.recordset[0]);
        
        // Test 7: Check final progress log
        console.log('\n7. Checking final progress log...');
        const finalProgressLog = await pool.request()
            .input('member_id', 1)
            .query(`
                SELECT TOP 5 * FROM avatar_progress_log 
                WHERE member_id = @member_id 
                ORDER BY created_at DESC
            `);
        
        console.log('Final progress log:', finalProgressLog.recordset);
        
        console.log('\n🎉 Avatar system test completed successfully!');
        
    } catch (error) {
        console.error('❌ Avatar system test failed:', error);
    }
}

testAvatarSystemSimple();
