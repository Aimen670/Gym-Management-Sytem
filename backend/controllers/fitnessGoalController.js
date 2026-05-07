const { sql, getPool } = require('../db');

async function getFitnessGoals(req, res) {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
            SELECT 
                fg.goal_id,
                fg.member_id,
                fg.goal_type,
                fg.target_value,
                fg.start_date,
                fg.target_date,
                m.full_name as member_name,
                CASE 
                    WHEN fg.target_date < GETDATE() THEN 'expired'
                    WHEN fg.start_date > GETDATE() THEN 'pending'
                    ELSE 'active'
                END as status
            FROM fitness_goals fg
            JOIN members m ON fg.member_id = m.member_id
            ORDER BY fg.start_date DESC
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Fitness goals fetch error:', err);
        res.status(500).json({ error: 'Failed to load fitness goals' });
    }
}

async function getFitnessGoalsByMember(req, res) {
    try {
        const memberId = parseInt(req.params.memberId, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member id' });
        }

        const pool = getPool();
        const result = await pool.request()
            .input('member_id', sql.Int, memberId)
            .query(`
                SELECT 
                    fg.goal_id,
                    fg.member_id,
                    fg.goal_type,
                    fg.target_value,
                    fg.start_date,
                    fg.target_date,
                    CASE 
                        WHEN fg.target_date < GETDATE() THEN 'expired'
                        WHEN fg.start_date > GETDATE() THEN 'pending'
                        ELSE 'active'
                    END as status
                FROM fitness_goals fg
                WHERE fg.member_id = @member_id
                ORDER BY fg.start_date DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Member fitness goals fetch error:', err);
        res.status(500).json({ error: 'Failed to load member fitness goals' });
    }
}

async function createFitnessGoal(req, res) {
    try {
        const { member_id, goal_type, target_value, start_date, target_date } = req.body;
        
        if (!member_id || !goal_type || !target_value || !start_date || !target_date) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const validGoalTypes = ['weight_loss', 'muscle_gain', 'endurance_improvement', 'strength_training', 'general_fitness'];
        if (!validGoalTypes.includes(goal_type)) {
            return res.status(400).json({ error: 'Invalid goal type' });
        }

        const pool = getPool();
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
        res.status(201).json({ goal_id: goalId, message: 'Fitness goal created successfully' });
    } catch (err) {
        console.error('Fitness goal create error:', err);
        res.status(400).json({ error: err.message });
    }
}

async function updateFitnessGoal(req, res) {
    try {
        const goalId = parseInt(req.params.id, 10);
        if (Number.isNaN(goalId)) {
            return res.status(400).json({ error: 'Invalid goal id' });
        }

        const { goal_type, target_value, start_date, target_date } = req.body;
        
        const pool = getPool();
        const result = await pool.request()
            .input('goal_id', sql.Int, goalId)
            .input('goal_type', sql.VarChar(50), goal_type)
            .input('target_value', sql.VarChar(50), target_value)
            .input('start_date', sql.Date, start_date)
            .input('target_date', sql.Date, target_date)
            .query(`
                UPDATE fitness_goals 
                SET goal_type = @goal_type, 
                    target_value = @target_value, 
                    start_date = @start_date, 
                    target_date = @target_date
                WHERE goal_id = @goal_id;
                
                SELECT @@ROWCOUNT as affected;
            `);
        
        if (result.recordset[0].affected === 0) {
            return res.status(404).json({ error: 'Fitness goal not found' });
        }
        
        res.json({ message: 'Fitness goal updated successfully' });
    } catch (err) {
        console.error('Fitness goal update error:', err);
        res.status(400).json({ error: err.message });
    }
}

async function deleteFitnessGoal(req, res) {
    try {
        const goalId = parseInt(req.params.id, 10);
        if (Number.isNaN(goalId)) {
            return res.status(400).json({ error: 'Invalid goal id' });
        }

        const pool = getPool();
        const result = await pool.request()
            .input('goal_id', sql.Int, goalId)
            .query('DELETE FROM fitness_goals WHERE goal_id = @goal_id; SELECT @@ROWCOUNT as affected;');
        
        if (result.recordset[0].affected === 0) {
            return res.status(404).json({ error: 'Fitness goal not found' });
        }
        
        res.json({ message: 'Fitness goal deleted successfully' });
    } catch (err) {
        console.error('Fitness goal delete error:', err);
        res.status(400).json({ error: err.message });
    }
}

async function getGoalProgress(req, res) {
    try {
        const goalId = parseInt(req.params.id, 10);
        if (Number.isNaN(goalId)) {
            return res.status(400).json({ error: 'Invalid goal id' });
        }

        const pool = getPool();
        
        const goalResult = await pool.request()
            .input('goal_id', sql.Int, goalId)
            .query(`
                SELECT fg.*, m.full_name as member_name
                FROM fitness_goals fg
                JOIN members m ON fg.member_id = m.member_id
                WHERE fg.goal_id = @goal_id
            `);

        if (goalResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Fitness goal not found' });
        }

        const goal = goalResult.recordset[0];
        
        let progressData = {
            goal: goal,
            current_progress: {},
            achievements: [],
            recommendations: []
        };

        if (goal.goal_type === 'weight_loss' || goal.goal_type === 'muscle_gain') {
            const measurementResult = await pool.request()
                .input('member_id', sql.Int, goal.member_id)
                .input('start_date', sql.Date, goal.start_date)
                .query(`
                    SELECT weight, bmi, body_fat, muscle_mass, record_date
                    FROM body_measurements 
                    WHERE member_id = @member_id AND record_date >= @start_date
                    ORDER BY record_date ASC
                `);
            
            progressData.current_progress.measurements = measurementResult.recordset;
            
            if (measurementResult.recordset.length > 0) {
                const firstMeasurement = measurementResult.recordset[0];
                const latestMeasurement = measurementResult.recordset[measurementResult.recordset.length - 1];
                
                const weightChange = latestMeasurement.weight - firstMeasurement.weight;
                progressData.weight_change = weightChange;
                
                if (goal.goal_type === 'weight_loss') {
                    progressData.progress_percentage = Math.max(0, Math.min(100, 
                        (Math.abs(weightChange) / parseFloat(goal.target_value)) * 100));
                } else if (goal.goal_type === 'muscle_gain') {
                    progressData.progress_percentage = Math.max(0, Math.min(100, 
                        (weightChange / parseFloat(goal.target_value)) * 100));
                }
            }
        }

        if (goal.goal_type === 'endurance_improvement' || goal.goal_type === 'strength_training') {
            const workoutResult = await pool.request()
                .input('member_id', sql.Int, goal.member_id)
                .input('start_date', sql.Date, goal.start_date)
                .query(`
                    SELECT wl.log_date, wl.reps_completed, wl.weight_used, 
                           e.exercise_name, wpe.sets, wpe.reps as target_reps
                    FROM workout_logs wl
                    JOIN exercises e ON wl.exercise_id = e.exercise_id
                    JOIN workout_plan_exercises wpe ON wl.exercise_id = wpe.exercise_id
                    JOIN workout_plans wp ON wl.workout_plan_id = wp.workout_plan_id
                    WHERE wl.member_id = @member_id AND wl.log_date >= @start_date
                    ORDER BY wl.log_date DESC
                `);
            
            progressData.current_progress.workouts = workoutResult.recordset;
            progressData.total_workouts = workoutResult.recordset.length;
            
            const weeklyWorkouts = workoutResult.recordset.filter(w => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(w.log_date) >= weekAgo;
            }).length;
            progressData.weekly_workouts = weeklyWorkouts;
        }

        const daysElapsed = Math.floor((new Date() - new Date(goal.start_date)) / (1000 * 60 * 60 * 24));
        const totalDays = Math.floor((new Date(goal.target_date) - new Date(goal.start_date)) / (1000 * 60 * 60 * 24));
        progressData.time_progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
        progressData.days_remaining = Math.max(0, totalDays - daysElapsed);

        res.json(progressData);
    } catch (err) {
        console.error('Goal progress fetch error:', err);
        res.status(500).json({ error: 'Failed to load goal progress' });
    }
}

module.exports = {
    getFitnessGoals,
    getFitnessGoalsByMember,
    createFitnessGoal,
    updateFitnessGoal,
    deleteFitnessGoal,
    getGoalProgress
};
