const { connectToDatabase } = require('../db');

// Get avatar data for a specific member
const getAvatarByMemberId = async (req, res) => {
    try {
        const { memberId } = req.params;
        const pool = await connectToDatabase();
        
        const query = `
            SELECT 
                ma.avatar_id,
                ma.member_id,
                ma.current_level,
                ma.total_points,
                ma.workout_points,
                ma.measurement_points,
                ma.goal_points,
                ma.last_updated,
                ma.avatar_url,
                al.level_name,
                al.description,
                al.min_points,
                al.max_points,
                m.full_name,
                m.join_date
            FROM member_avatars ma
            JOIN avatar_levels al ON ma.current_level = al.level_id
            JOIN members m ON ma.member_id = m.member_id
            WHERE ma.member_id = @memberId
        `;
        
        const result = await pool.request()
            .input('memberId', memberId)
            .query(query);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Avatar not found for this member' });
        }
        
        const avatarData = result.recordset[0];
        
        // Calculate progress to next level
        const progressToNextLevel = calculateProgressToNextLevel(avatarData.total_points, avatarData.current_level);
        
        res.json({
            ...avatarData,
            progressToNextLevel
        });
        
    } catch (error) {
        console.error('Error fetching avatar data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get avatar progress history for a member
const getAvatarProgress = async (req, res) => {
    try {
        const { memberId } = req.params;
        const pool = await connectToDatabase();
        
        const query = `
            SELECT 
                progress_id,
                member_id,
                points_earned,
                reason,
                old_level,
                new_level,
                created_at
            FROM avatar_progress_log
            WHERE member_id = @memberId
            ORDER BY created_at DESC
        `;
        
        const result = await pool.request()
            .input('memberId', memberId)
            .query(query);
        
        res.json(result.recordset);
        
    } catch (error) {
        console.error('Error fetching avatar progress:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all avatar levels
const getAllAvatarLevels = async (req, res) => {
    try {
        const pool = await connectToDatabase();
        
        const query = `
            SELECT 
                level_id,
                level_name,
                min_points,
                max_points,
                avatar_style,
                description
            FROM avatar_levels
            ORDER BY level_id
        `;
        
        const result = await pool.request().query(query);
        res.json(result.recordset);
        
    } catch (error) {
        console.error('Error fetching avatar levels:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Manual avatar update (for testing/admin)
const updateAvatarManually = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { points, reason } = req.body;
        
        if (!points || !reason) {
            return res.status(400).json({ message: 'Points and reason are required' });
        }
        
        const pool = await connectToDatabase();
        
        // Update avatar points
        const updateQuery = `
            UPDATE member_avatars 
            SET total_points = total_points + @points,
                goal_points = goal_points + @points,
                last_updated = GETDATE()
            WHERE member_id = @memberId;
            
            -- Log the manual update
            INSERT INTO avatar_progress_log (member_id, points_earned, reason)
            VALUES (@memberId, @points, @reason);
        `;
        
        await pool.request()
            .input('memberId', memberId)
            .input('points', points)
            .input('reason', reason)
            .query(updateQuery);
        
        // Update level if needed
        await pool.request()
            .input('memberId', memberId)
            .execute('sp_update_avatar_level');
        
        res.json({ message: 'Avatar updated successfully' });
        
    } catch (error) {
        console.error('Error updating avatar manually:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Helper function to calculate progress to next level
function calculateProgressToNextLevel(totalPoints, currentLevel) {
    const levels = [
        { id: 1, min: 0, max: 10 },
        { id: 2, min: 11, max: 25 },
        { id: 3, min: 26, max: 50 },
        { id: 4, min: 51, max: 100 },
        { id: 5, min: 101, max: 200 },
        { id: 6, min: 201, max: 350 },
        { id: 7, min: 351, max: 500 },
        { id: 8, min: 501, max: 750 },
        { id: 9, min: 751, max: 1000 },
        { id: 10, min: 1001, max: 999999 }
    ];
    
    if (currentLevel >= 10) {
        return { currentLevel: 10, nextLevel: null, progress: 100, pointsToNext: 0 };
    }
    
    const currentLevelData = levels.find(l => l.id === currentLevel);
    const nextLevelData = levels.find(l => l.id === currentLevel + 1);
    
    if (!currentLevelData || !nextLevelData) {
        return { currentLevel, nextLevel: null, progress: 0, pointsToNext: 0 };
    }
    
    const pointsInCurrentLevel = totalPoints - currentLevelData.min;
    const pointsNeededForNextLevel = nextLevelData.min - currentLevelData.min;
    const progress = Math.min(100, (pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
    const pointsToNext = Math.max(0, nextLevelData.min - totalPoints);
    
    return {
        currentLevel,
        nextLevel: nextLevelData.id,
        progress: Math.round(progress),
        pointsToNext
    };
}

module.exports = {
    getAvatarByMemberId,
    getAvatarProgress,
    getAllAvatarLevels,
    updateAvatarManually
};
