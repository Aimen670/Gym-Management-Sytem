const { connectToDatabase, getPool, sql } = require('./db');

async function createMissingTables() {
    try {
        await connectToDatabase();
        const pool = getPool();
        
        console.log('Creating missing tables...');
        
        // Create exercises table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[exercises]') AND type in (N'U'))
            BEGIN
                CREATE TABLE exercises (
                    exercise_id INT PRIMARY KEY IDENTITY(1,1),
                    exercise_name VARCHAR(100) NOT NULL UNIQUE,
                    description TEXT
                );
                PRINT 'Exercises table created successfully';
            END
            ELSE
            BEGIN
                PRINT 'Exercises table already exists';
            END
        `);

        // Insert sample exercises if they don't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM exercises)
            BEGIN
                INSERT INTO exercises (exercise_name) VALUES
                ('Bench Press'),
                ('Incline Dumbbell Press'),
                ('Lat Pulldown'),
                ('Seated Row'),
                ('Squats'),
                ('Leg Press'),
                ('Hamstring Curl'),
                ('Deadlift'),
                ('Overhead Press');
                PRINT 'Sample exercises inserted successfully';
            END
            ELSE
            BEGIN
                PRINT 'Exercises already exist in the table';
            END
        `);

        // Create workout_plan_exercises table if it doesn't exist
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[workout_plan_exercises]') AND type in (N'U'))
            BEGIN
                CREATE TABLE workout_plan_exercises (
                    plan_exercise_id INT PRIMARY KEY IDENTITY(1,1),
                    workout_plan_id INT NOT NULL,
                    exercise_id INT NOT NULL,
                    sets INT NOT NULL CHECK (sets > 0),
                    reps INT NOT NULL CHECK (reps > 0),
                    schedule_day VARCHAR(20) CHECK (schedule_day IN ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
                    UNIQUE (workout_plan_id, exercise_id, schedule_day),
                    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(workout_plan_id) ON DELETE CASCADE,
                    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id) ON DELETE CASCADE
                );
                PRINT 'Workout plan exercises table created successfully';
            END
            ELSE
            BEGIN
                PRINT 'Workout plan exercises table already exists';
            END
        `);

        console.log('All missing tables created successfully!');
        
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

// Run the script
createMissingTables()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Script failed:', err);
        process.exit(1);
    });
