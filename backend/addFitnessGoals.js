const { connectToDatabase } = require('./db');

async function addFitnessGoals() {
    try {
        await connectToDatabase();
        console.log('Connected to database');

        const { sql, getPool } = require('./db');
        const pool = getPool();

        const fitnessGoals = [
            // Ali Khan (member_id: 1) - Muscle Gain goal
            [1, 'muscle_gain', '5', '2025-01-10', '2025-06-10'],
            
            // Ahmed Raza (member_id: 2) - Weight Loss goal
            [2, 'weight_loss', '8', '2025-02-15', '2025-05-15'],
            
            // Fatima Noor (member_id: 3) - Endurance Improvement goal
            [3, 'endurance_improvement', '30', '2025-03-01', '2025-08-01'],
            
            // Ayesha Malik (member_id: 4) - Weight Loss goal
            [4, 'weight_loss', '6', '2025-02-20', '2025-07-20'],
            
            // Hassan Ali (member_id: 5) - Strength Training goal
            [5, 'strength_training', '50', '2025-01-05', '2025-04-05']
        ];

        console.log('Adding fitness goals...');
        
        for (const [member_id, goal_type, target_value, start_date, target_date] of fitnessGoals) {
            try {
                const result = await pool.request()
                    .input('member_id', sql.Int, member_id)
                    .input('goal_type', sql.VarChar(50), goal_type)
                    .input('target_value', sql.VarChar(50), target_value)
                    .input('start_date', sql.Date, start_date)
                    .input('target_date', sql.Date, target_date)
                    .query(`
                        INSERT INTO fitness_goals (member_id, goal_type, target_value, start_date, target_date)
                        VALUES (@member_id, @goal_type, @target_value, @start_date, @target_date);
                        SELECT SCOPE_IDENTITY() as goal_id;
                    `);
                
                const goalId = result.recordset[0].goal_id;
                console.log(`✓ Created fitness goal for member ${member_id}: ${goal_type} (ID: ${goalId})`);
                
            } catch (error) {
                console.log(`✗ Failed to create fitness goal for member ${member_id}: ${error.message}`);
            }
        }

        // Add some sample body measurements for progress tracking
        console.log('\nAdding sample body measurements...');
        const bodyMeasurements = [
            // Ali Khan - Muscle gain progress
            [1, 75.5, 23.2, 15.5, 40.2, '2025-01-10'],
            [1, 76.8, 23.6, 15.2, 41.1, '2025-02-10'],
            [1, 78.2, 24.0, 14.8, 42.3, '2025-03-10'],
            
            // Ahmed Raza - Weight loss progress
            [2, 85.3, 26.8, 22.1, 35.8, '2025-02-15'],
            [2, 83.7, 26.3, 21.5, 35.2, '2025-03-15'],
            [2, 81.9, 25.7, 20.8, 34.6, '2025-04-15'],
            
            // Fatima Noor - General fitness measurements
            [3, 62.1, 22.4, 18.9, 32.5, '2025-03-01'],
            [3, 61.8, 22.3, 18.7, 32.8, '2025-04-01'],
            
            // Ayesha Malik - Weight loss progress
            [4, 68.4, 24.1, 19.8, 31.2, '2025-02-20'],
            [4, 66.9, 23.6, 19.2, 30.8, '2025-03-20'],
            
            // Hassan Ali - Strength training measurements
            [5, 82.7, 25.9, 16.5, 38.9, '2025-01-05'],
            [5, 83.5, 26.1, 16.2, 39.5, '2025-02-05']
        ];

        for (const [member_id, weight, bmi, body_fat, muscle_mass, record_date] of bodyMeasurements) {
            try {
                await pool.request()
                    .input('member_id', sql.Int, member_id)
                    .input('weight', sql.Decimal(5,2), weight)
                    .input('bmi', sql.Decimal(5,2), bmi)
                    .input('body_fat', sql.Decimal(5,2), body_fat)
                    .input('muscle_mass', sql.Decimal(5,2), muscle_mass)
                    .input('record_date', sql.Date, record_date)
                    .query(`
                        INSERT INTO body_measurements (member_id, weight, bmi, body_fat, muscle_mass, record_date)
                        VALUES (@member_id, @weight, @bmi, @body_fat, @muscle_mass, @record_date)
                    `);
                
                console.log(`✓ Added body measurement for member ${member_id} on ${record_date}`);
            } catch (error) {
                console.log(`✗ Failed to add body measurement for member ${member_id}: ${error.message}`);
            }
        }

        // Add some sample workout logs for progress tracking
        console.log('\nAdding sample workout logs...');
        const workoutLogs = [
            // Ali Khan - Strength workouts
            [1, 1, 1, 60.0, 8, '2025-03-05'],
            [1, 1, 2, 25.0, 10, '2025-03-05'],
            [1, 1, 1, 62.5, 8, '2025-03-12'],
            [1, 1, 2, 27.5, 10, '2025-03-12'],
            
            // Ahmed Raza - Cardio workouts
            [2, 2, 5, 80.0, 8, '2025-03-10'],
            [2, 2, 6, 120.0, 12, '2025-03-10'],
            [2, 2, 5, 85.0, 8, '2025-03-17'],
            [2, 2, 6, 125.0, 12, '2025-03-17'],
            
            // Fatima Noor - Mixed workouts
            [3, 3, 8, 70.0, 6, '2025-03-15'],
            [3, 3, 9, 35.0, 8, '2025-03-15'],
            
            // Ayesha Malik - Weight loss workouts
            [4, 1, 5, 50.0, 10, '2025-03-08'],
            [4, 1, 6, 100.0, 15, '2025-03-08'],
            
            // Hassan Ali - Strength workouts
            [5, 1, 8, 90.0, 6, '2025-03-01'],
            [5, 1, 9, 40.0, 8, '2025-03-01']
        ];

        for (const [member_id, workout_plan_id, exercise_id, weight_used, reps_completed, log_date] of workoutLogs) {
            try {
                await pool.request()
                    .input('member_id', sql.Int, member_id)
                    .input('workout_plan_id', sql.Int, workout_plan_id)
                    .input('exercise_id', sql.Int, exercise_id)
                    .input('weight_used', sql.Decimal(6,2), weight_used)
                    .input('reps_completed', sql.Int, reps_completed)
                    .input('log_date', sql.Date, log_date)
                    .query(`
                        INSERT INTO workout_logs (member_id, workout_plan_id, exercise_id, weight_used, reps_completed, log_date)
                        VALUES (@member_id, @workout_plan_id, @exercise_id, @weight_used, @reps_completed, @log_date)
                    `);
                
                console.log(`✓ Added workout log for member ${member_id} on ${log_date}`);
            } catch (error) {
                console.log(`✗ Failed to add workout log for member ${member_id}: ${error.message}`);
            }
        }

        console.log('\n✅ All fitness goals and test data inserted successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

addFitnessGoals();
