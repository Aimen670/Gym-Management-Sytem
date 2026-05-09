const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db');

// Get workout plans for a member
router.get('/member-workout-plans/:memberId', async (req, res) => {
    try {
        const { memberId } = req.params;
        const pool = getPool();
        
        const plansResult = await pool.request()
            .input('member_id', sql.Int, memberId)
            .query(`
                SELECT
                    wp.workout_plan_id,
                    wp.member_id,
                    wp.trainer_id,
                    wp.created_date,
                    t.name AS trainer_name
                FROM workout_plans wp
                LEFT JOIN trainers t ON wp.trainer_id = t.trainer_id
                WHERE wp.member_id = @member_id
                ORDER BY wp.created_date DESC, wp.workout_plan_id DESC
            `);

        if (plansResult.recordset.length === 0) {
            return res.json([]);
        }

        const plans = plansResult.recordset.map((row) => ({
            ...row,
            exercises: []
        }));

        const planMap = new Map(plans.map((plan) => [plan.workout_plan_id, plan]));
        const request = pool.request();
        const idParams = plans.map((plan, idx) => {
            const key = `plan_id_${idx}`;
            request.input(key, sql.Int, plan.workout_plan_id);
            return `@${key}`;
        });

        const exercisesResult = await request.query(`
            SELECT
                wpe.plan_exercise_id,
                wpe.workout_plan_id,
                wpe.exercise_id,
                e.exercise_name,
                wpe.sets,
                wpe.reps,
                wpe.schedule_day
            FROM workout_plan_exercises wpe
            JOIN exercises e ON wpe.exercise_id = e.exercise_id
            WHERE workout_plan_id IN (${idParams.join(', ')})
            ORDER BY wpe.workout_plan_id, wpe.schedule_day, e.exercise_name
        `);

        exercisesResult.recordset.forEach((row) => {
            const plan = planMap.get(row.workout_plan_id);
            if (plan) {
                plan.exercises.push(row);
            }
        });

        res.json(plans);
    } catch (error) {
        console.error('Error fetching member workout plans:', error);
        res.status(500).json({ error: 'Failed to fetch workout plans' });
    }
});

// Get exercises for a workout plan
router.get('/workout-plans/:planId/exercises', async (req, res) => {
    try {
        const { planId } = req.params;
        const pool = getPool();
        
        const result = await pool.request()
            .input('workout_plan_id', sql.Int, planId)
            .query(`
                SELECT
                    wpe.exercise_id,
                    e.exercise_name,
                    wpe.sets,
                    wpe.reps
                FROM workout_plan_exercises wpe
                JOIN exercises e ON wpe.exercise_id = e.exercise_id
                WHERE wpe.workout_plan_id = @workout_plan_id
                ORDER BY e.exercise_name
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching plan exercises:', error);
        res.status(500).json({ error: 'Failed to fetch exercises' });
    }
});

// Create a new remote session
router.post('/remote-sessions', async (req, res) => {
    try {
        const { member_id, workout_plan_id, local_ip } = req.body;
        
        const memberId = parseInt(member_id, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member_id' });
        }

        const pool = getPool();
        const result = await pool.request()
            .input('member_id', sql.Int, memberId)
            .input('workout_plan_id', sql.Int, workout_plan_id || null)
            .input('local_ip', sql.VarChar(50), local_ip || null)
            .output('session_token', sql.UniqueIdentifier)
            .query('EXEC SP_create_remote_session @member_id, @workout_plan_id, @local_ip, @session_token OUTPUT');

        const sessionToken = result.output.session_token;
        
        res.status(201).json({ 
            session_token: sessionToken,
            member_id: memberId,
            connect_url: `http://${local_ip || 'localhost'}:5174/connect/${sessionToken}`
        });
    } catch (err) {
        console.error('Error creating remote session:', err);
        res.status(500).json({ error: err.message || 'Failed to create remote session' });
    }
});

// Get session by token
router.get('/remote-sessions/:sessionToken', async (req, res) => {
    try {
        const { sessionToken } = req.params;
        
        const pool = getPool();
        const result = await pool.request()
            .input('session_token', sql.UniqueIdentifier, sessionToken)
            .query('EXEC SP_get_session_by_token @session_token');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error getting session:', err);
        res.status(500).json({ error: err.message || 'Failed to get session' });
    }
});

// Update session status
router.put('/remote-sessions/:sessionToken/status', async (req, res) => {
    try {
        const { sessionToken } = req.params;
        const { status } = req.body;

        const validStatuses = ['waiting', 'connected', 'disconnected', 'ended'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const pool = getPool();
        await pool.request()
            .input('session_token', sql.UniqueIdentifier, sessionToken)
            .input('status', sql.VarChar(20), status)
            .query('EXEC SP_update_session_status @session_token, @status');

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating session status:', err);
        res.status(500).json({ error: err.message || 'Failed to update session status' });
    }
});

module.exports = router;
