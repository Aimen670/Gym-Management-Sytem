const { connectToDatabase } = require('./db');

async function testAvatarSystem() {
    try {
        console.log('Testing Avatar System...');
        
        const pool = await connectToDatabase();
        
        // Test 1: Check if avatar tables exist
        console.log('\n1. Checking avatar tables...');
        const tablesResult = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME IN ('avatar_levels', 'member_avatars', 'avatar_progress_log')
        `);
        
        console.log('Tables found:', tablesResult.recordset.map(t => t.TABLE_NAME));
        
        // Test 2: Check avatar levels
        console.log('\n2. Checking avatar levels...');
        const levelsResult = await pool.request().query('SELECT * FROM avatar_levels ORDER BY level_id');
        console.log('Avatar levels:', levelsResult.recordset);
        
        // Test 3: Check member avatars
        console.log('\n3. Checking member avatars...');
        const avatarsResult = await pool.request().query('SELECT * FROM member_avatars');
        console.log('Member avatars:', avatarsResult.recordset);
        
        // Test 4: Create test workout log to trigger avatar update
        console.log('\n4. Creating test workout log...');
        const testWorkoutResult = await pool.request().query(`
            INSERT INTO workout_logs (member_id, workout_plan_id, exercise_id, weight_used, reps_completed, log_date)
            OUTPUT inserted.log_id
            VALUES (1, 1, 1, 50, 10, GETDATE())
        `);
        console.log('Test workout created with ID:', testWorkoutResult.recordset[0].log_id);
        
        // Test 5: Check avatar progress after workout
        console.log('\n5. Checking avatar progress after workout...');
        const progressResult = await pool.request().query('SELECT * FROM member_avatars WHERE member_id = 1');
        console.log('Avatar after workout:', progressResult.recordset[0]);
        
        // Test 6: Check progress log
        console.log('\n6. Checking progress log...');
        const logResult = await pool.request().query(`
            SELECT TOP 5 * FROM avatar_progress_log 
            WHERE member_id = 1 
            ORDER BY created_at DESC
        `);
        console.log('Recent progress:', logResult.recordset);
        
        console.log('\n✅ Avatar system test completed successfully!');
        
    } catch (error) {
        console.error('❌ Avatar system test failed:', error);
    }
}

testAvatarSystem();
