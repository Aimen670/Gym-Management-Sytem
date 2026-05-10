const { connectToDatabase } = require('./db');
const fs = require('fs');
const path = require('path');

async function setupAvatarSystem() {
    try {
        console.log('Setting up Avatar System...');
        
        const pool = await connectToDatabase();
        
        // Read the SQL file and extract avatar-related commands
        const sqlFilePath = path.join(__dirname, '..', '..', 'gym_management.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // Find avatar-related SQL commands
        const avatarCommands = [
            // Create avatar_levels table
            `CREATE TABLE avatar_levels (
                level_id INT PRIMARY KEY,
                level_name VARCHAR(50) NOT NULL,
                min_points INT NOT NULL,
                max_points INT NOT NULL,
                avatar_style VARCHAR(100) NOT NULL,
                description TEXT
            );`,
            
            // Create member_avatars table
            `CREATE TABLE member_avatars (
                avatar_id INT PRIMARY KEY IDENTITY(1,1),
                member_id INT UNIQUE NOT NULL,
                current_level INT DEFAULT 1,
                total_points INT DEFAULT 0,
                workout_points INT DEFAULT 0,
                measurement_points INT DEFAULT 0,
                goal_points INT DEFAULT 0,
                last_updated DATETIME2 DEFAULT GETDATE(),
                avatar_url VARCHAR(500),
                FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
            );`,
            
            // Create avatar_progress_log table
            `CREATE TABLE avatar_progress_log (
                progress_id INT PRIMARY KEY IDENTITY(1,1),
                member_id INT NOT NULL,
                points_earned INT NOT NULL,
                reason VARCHAR(200) NOT NULL,
                old_level INT,
                new_level INT,
                created_at DATETIME2 DEFAULT GETDATE(),
                FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
            );`
        ];
        
        // Execute table creation commands
        for (const command of avatarCommands) {
            try {
                await pool.request().query(command);
                console.log('✅ Table created successfully');
            } catch (error) {
                if (error.number === 2714) {
                    console.log('⚠️ Table already exists');
                } else {
                    console.error('❌ Error creating table:', error.message);
                }
            }
        }
        
        // Insert avatar levels data
        const levelsData = [
            [1, 'Beginner', 0, 10, 'basic-avatar', 'Just starting the fitness journey'],
            [2, 'Novice', 11, 25, 'novice-avatar', 'Building consistency'],
            [3, 'Intermediate', 26, 50, 'intermediate-avatar', 'Making good progress'],
            [4, 'Advanced', 51, 100, 'advanced-avatar', 'Dedicated fitness enthusiast'],
            [5, 'Expert', 101, 200, 'expert-avatar', 'Serious about fitness'],
            [6, 'Elite', 201, 350, 'elite-avatar', 'Fitness elite'],
            [7, 'Master', 351, 500, 'master-avatar', 'Fitness master'],
            [8, 'Champion', 501, 750, 'champion-avatar', 'Fitness champion'],
            [9, 'Legend', 751, 1000, 'legend-avatar', 'Fitness legend'],
            [10, 'Icon', 1001, 999999, 'icon-avatar', 'Fitness icon']
        ];
        
        console.log('\nInserting avatar levels...');
        for (const [level_id, level_name, min_points, max_points, avatar_style, description] of levelsData) {
            try {
                await pool.request()
                    .input('level_id', level_id)
                    .input('level_name', level_name)
                    .input('min_points', min_points)
                    .input('max_points', max_points)
                    .input('avatar_style', avatar_style)
                    .input('description', description)
                    .query(`
                        INSERT INTO avatar_levels (level_id, level_name, min_points, max_points, avatar_style, description)
                        VALUES (@level_id, @level_name, @min_points, @max_points, @avatar_style, @description)
                    `);
                console.log(`✅ Level ${level_id} (${level_name}) inserted`);
            } catch (error) {
                if (error.number === 2627) {
                    console.log(`⚠️ Level ${level_id} already exists`);
                } else {
                    console.error(`❌ Error inserting level ${level_id}:`, error.message);
                }
            }
        }
        
        // Initialize avatars for existing members
        console.log('\nInitializing avatars for existing members...');
        try {
            await pool.request().query(`
                INSERT INTO member_avatars (member_id, current_level, total_points, avatar_url)
                SELECT 
                    member_id, 
                    1, 
                    0,
                    '/avatars/level1-beginner.png'
                FROM members
                WHERE member_id NOT IN (SELECT member_id FROM member_avatars)
            `);
            console.log('✅ Avatars initialized for existing members');
        } catch (error) {
            console.error('❌ Error initializing avatars:', error.message);
        }
        
        // Create stored procedure for updating avatar levels
        console.log('\nCreating stored procedure for level updates...');
        const procedureSQL = `
            CREATE OR ALTER PROCEDURE sp_update_avatar_level
                @member_id INT
            AS
            BEGIN
                DECLARE @current_points INT;
                DECLARE @current_level INT;
                DECLARE @new_level INT;
                DECLARE @avatar_url VARCHAR(500);
                
                -- Get current data
                SELECT @current_points = total_points, @current_level = current_level
                FROM member_avatars 
                WHERE member_id = @member_id;
                
                -- Determine new level based on points
                SELECT TOP 1 @new_level = level_id, @avatar_url = '/avatars/level' + CAST(level_id AS VARCHAR) + '-' + level_name + '.png'
                FROM avatar_levels 
                WHERE @current_points >= min_points AND @current_points <= max_points;
                
                -- Update if level changed
                IF @new_level IS NOT NULL AND @new_level != @current_level
                BEGIN
                    UPDATE member_avatars 
                    SET current_level = @new_level,
                        avatar_url = @avatar_url,
                        last_updated = GETDATE()
                    WHERE member_id = @member_id;
                    
                    -- Log level up
                    INSERT INTO avatar_progress_log (member_id, points_earned, reason, old_level, new_level)
                    VALUES (@member_id, 0, 'Level up from ' + CAST(@current_level AS VARCHAR) + ' to ' + CAST(@new_level AS VARCHAR), @current_level, @new_level);
                END
            END;
        `;
        
        try {
            await pool.request().query(procedureSQL);
            console.log('✅ Stored procedure created/updated');
        } catch (error) {
            console.error('❌ Error creating stored procedure:', error.message);
        }
        
        console.log('\n🎉 Avatar system setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Avatar system setup failed:', error);
    }
}

setupAvatarSystem();
