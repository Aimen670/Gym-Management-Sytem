const { connectToDatabase } = require('./db');

async function createAvatarTriggers() {
    try {
        console.log('Creating Avatar Triggers...');
        
        const pool = await connectToDatabase();
        
        // Drop existing triggers if they exist
        console.log('Dropping existing triggers...');
        try {
            await pool.request().query('DROP TRIGGER IF EXISTS trg_workout_avatar_progress');
            console.log('✅ Dropped trg_workout_avatar_progress');
        } catch (error) {
            console.log('⚠️ trg_workout_avatar_progress does not exist');
        }
        
        try {
            await pool.request().query('DROP TRIGGER IF EXISTS trg_measurement_avatar_progress');
            console.log('✅ Dropped trg_measurement_avatar_progress');
        } catch (error) {
            console.log('⚠️ trg_measurement_avatar_progress does not exist');
        }
        
        // Create workout trigger
        console.log('\nCreating workout trigger...');
        const workoutTriggerSQL = `
            CREATE TRIGGER trg_workout_avatar_progress
            ON workout_logs
            AFTER INSERT
            AS
            BEGIN
                SET NOCOUNT ON;
                DECLARE @member_id INT;
                DECLARE @points INT = 5; -- 5 points per workout
                
                SELECT @member_id = member_id FROM inserted;
                
                IF EXISTS (SELECT 1 FROM member_avatars WHERE member_id = @member_id)
                BEGIN
                    UPDATE member_avatars 
                    SET workout_points = workout_points + @points,
                        total_points = total_points + @points,
                        last_updated = GETDATE()
                    WHERE member_id = @member_id;
                    
                    -- Log progress
                    INSERT INTO avatar_progress_log (member_id, points_earned, reason)
                    VALUES (@member_id, @points, 'Workout completed');
                    
                    -- Update level if needed
                    EXEC sp_update_avatar_level @member_id;
                END
            END;
        `;
        
        try {
            await pool.request().query(workoutTriggerSQL);
            console.log('✅ Workout trigger created successfully');
        } catch (error) {
            console.error('❌ Error creating workout trigger:', error.message);
        }
        
        // Create measurement trigger
        console.log('\nCreating measurement trigger...');
        const measurementTriggerSQL = `
            CREATE TRIGGER trg_measurement_avatar_progress
            ON body_measurements
            AFTER INSERT
            AS
            BEGIN
                SET NOCOUNT ON;
                DECLARE @member_id INT;
                DECLARE @points INT = 10; -- 10 points for measurements
                DECLARE @improvement_points INT = 0;
                DECLARE @current_bmi DECIMAL(5,2);
                DECLARE @prev_bmi DECIMAL(5,2);
                DECLARE @current_muscle DECIMAL(5,2);
                DECLARE @prev_muscle DECIMAL(5,2);
                
                SELECT @member_id = member_id, @current_bmi = bmi, @current_muscle = muscle_mass 
                FROM inserted;
                
                -- Check for improvements compared to previous measurements
                SELECT TOP 1 @prev_bmi = bmi, @prev_muscle = muscle_mass
                FROM body_measurements 
                WHERE member_id = @member_id AND record_date < (SELECT record_date FROM inserted)
                ORDER BY record_date DESC;
                
                IF @prev_bmi IS NOT NULL
                BEGIN
                    -- BMI improvement (decrease for weight loss goals, increase for muscle gain)
                    IF @current_bmi < @prev_bmi SET @improvement_points = @improvement_points + 15;
                    -- Muscle mass improvement
                    IF @current_muscle > @prev_muscle SET @improvement_points = @improvement_points + 20;
                END
                
                SET @points = @points + @improvement_points;
                
                IF EXISTS (SELECT 1 FROM member_avatars WHERE member_id = @member_id)
                BEGIN
                    UPDATE member_avatars 
                    SET measurement_points = measurement_points + @points,
                        total_points = total_points + @points,
                        last_updated = GETDATE()
                    WHERE member_id = @member_id;
                    
                    -- Log progress
                    DECLARE @reason VARCHAR(200) = 'Body measurements recorded';
                    IF @improvement_points > 0
                        SET @reason = @reason + ' (Improvement: +' + CAST(@improvement_points AS VARCHAR) + ' points)';
                        
                    INSERT INTO avatar_progress_log (member_id, points_earned, reason)
                    VALUES (@member_id, @points, @reason);
                    
                    -- Update level if needed
                    EXEC sp_update_avatar_level @member_id;
                END
            END;
        `;
        
        try {
            await pool.request().query(measurementTriggerSQL);
            console.log('✅ Measurement trigger created successfully');
        } catch (error) {
            console.error('❌ Error creating measurement trigger:', error.message);
        }
        
        console.log('\n🎉 Avatar triggers created successfully!');
        
    } catch (error) {
        console.error('❌ Avatar trigger creation failed:', error);
    }
}

createAvatarTriggers();
