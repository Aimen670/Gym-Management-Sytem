const { sql, getPool } = require('../db');

async function getWorkoutPlansForMember(memberId) {
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
        return [];
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
            wpe.plan_exercise_id AS exercise_id,
            wpe.workout_plan_id,
            wpe.exercise_id AS exercise_catalog_id,
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

    return plans;
}

async function getBodyMeasurementsForMember(memberId) {
    const pool = getPool();
    const result = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT
                measurement_id,
                weight,
                bmi,
                body_fat,
                muscle_mass,
                record_date
            FROM body_measurements
            WHERE member_id = @member_id
            ORDER BY record_date DESC, measurement_id DESC
        `);

    return result.recordset;
}

async function getWorkoutLogsForMember(memberId) {
    const pool = getPool();
    const result = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT
                wl.log_id,
                wl.workout_plan_id,
                wl.exercise_id,
                e.exercise_name,
                wl.weight_used,
                wl.reps_completed,
                wl.log_date
            FROM workout_logs wl
            JOIN exercises e ON wl.exercise_id = e.exercise_id
            WHERE wl.member_id = @member_id
            ORDER BY wl.log_date DESC, wl.log_id DESC
        `);

    return result.recordset;
}

async function getWorkoutLogStatsForMember(memberId) {
    const pool = getPool();
    const result = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT
                COUNT(*) AS total_logs,
                COUNT(DISTINCT exercise_id) AS unique_exercises,
                MAX(weight_used) AS max_weight,
                AVG(weight_used) AS avg_weight,
                AVG(reps_completed) AS avg_reps,
                MAX(log_date) AS last_log_date,
                SUM(CASE WHEN log_date >= DATEADD(day, -7, CAST(GETDATE() AS DATE)) THEN 1 ELSE 0 END) AS logs_last_7,
                SUM(CASE WHEN log_date >= DATEADD(day, -30, CAST(GETDATE() AS DATE)) THEN 1 ELSE 0 END) AS logs_last_30
            FROM workout_logs
            WHERE member_id = @member_id
        `);

    const row = result.recordset[0] || {};
    return {
        total_logs: row.total_logs ?? 0,
        unique_exercises: row.unique_exercises ?? 0,
        max_weight: row.max_weight ?? 0,
        avg_weight: row.avg_weight ?? 0,
        avg_reps: row.avg_reps ?? 0,
        last_log_date: row.last_log_date ?? null,
        logs_last_7: row.logs_last_7 ?? 0,
        logs_last_30: row.logs_last_30 ?? 0
    };
}

async function createWorkoutLog(memberId, payload) {
    const planId = parseInt(payload.workout_plan_id, 10);
    const exerciseId = parseInt(payload.exercise_id, 10);
    const weightUsed = parseFloat(payload.weight_used);
    const repsCompleted = parseInt(payload.reps_completed, 10);
    const logRaw = payload.log_date ? String(payload.log_date).trim() : '';

    if (Number.isNaN(planId)) {
        throw new Error('workout_plan_id is required');
    }
    if (Number.isNaN(exerciseId)) {
        throw new Error('exercise_id is required');
    }
    if (Number.isNaN(weightUsed) || weightUsed < 0) {
        throw new Error('Weight must be 0 or a positive number');
    }
    if (Number.isNaN(repsCompleted) || repsCompleted < 0) {
        throw new Error('Reps must be 0 or a positive number');
    }

    let logDate = null;
    if (logRaw) {
        const d = new Date(logRaw);
        if (Number.isNaN(d.getTime())) {
            throw new Error('Invalid log date');
        }
        logDate = d.toISOString().slice(0, 10);
    }

    const pool = getPool();
    const planCheck = await pool.request()
        .input('member_id', sql.Int, memberId)
        .input('workout_plan_id', sql.Int, planId)
        .query('SELECT workout_plan_id FROM workout_plans WHERE workout_plan_id = @workout_plan_id AND member_id = @member_id');

    if (planCheck.recordset.length === 0) {
        throw new Error('Workout plan not found for this member');
    }

    const exerciseCheck = await pool.request()
        .input('workout_plan_id', sql.Int, planId)
        .input('exercise_id', sql.Int, exerciseId)
        .query('SELECT 1 FROM workout_plan_exercises WHERE workout_plan_id = @workout_plan_id AND exercise_id = @exercise_id');

    if (exerciseCheck.recordset.length === 0) {
        throw new Error('Exercise is not part of the selected plan');
    }

    const insertResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .input('workout_plan_id', sql.Int, planId)
        .input('exercise_id', sql.Int, exerciseId)
        .input('weight_used', sql.Decimal(6, 2), weightUsed)
        .input('reps_completed', sql.Int, repsCompleted)
        .input('log_date', sql.Date, logDate)
        .query(`
            INSERT INTO workout_logs (member_id, workout_plan_id, exercise_id, weight_used, reps_completed, log_date)
            OUTPUT INSERTED.log_id, INSERTED.log_date
            VALUES (
                @member_id,
                @workout_plan_id,
                @exercise_id,
                @weight_used,
                @reps_completed,
                COALESCE(@log_date, CAST(GETDATE() AS DATE))
            )
        `);

    return {
        log_id: insertResult.recordset[0].log_id,
        member_id: memberId,
        workout_plan_id: planId,
        exercise_id: exerciseId,
        weight_used: weightUsed,
        reps_completed: repsCompleted,
        log_date: insertResult.recordset[0].log_date
    };
}

async function createBodyMeasurement(memberId, payload) {
    const weight = parseFloat(payload.weight);
    const bmi = parseFloat(payload.bmi);
    const bodyFat = payload.body_fat === '' || payload.body_fat == null ? null : parseFloat(payload.body_fat);
    const muscleMass = payload.muscle_mass === '' || payload.muscle_mass == null ? null : parseFloat(payload.muscle_mass);
    const recordRaw = payload.record_date ? String(payload.record_date).trim() : '';

    if (Number.isNaN(weight) || weight <= 0) {
        throw new Error('Weight must be a positive number');
    }
    if (Number.isNaN(bmi) || bmi <= 0) {
        throw new Error('BMI must be a positive number');
    }
    if (bodyFat !== null && (Number.isNaN(bodyFat) || bodyFat < 0)) {
        throw new Error('Body fat must be 0 or a positive number');
    }
    if (muscleMass !== null && (Number.isNaN(muscleMass) || muscleMass < 0)) {
        throw new Error('Muscle mass must be 0 or a positive number');
    }

    let recordDate = null;
    if (recordRaw) {
        const d = new Date(recordRaw);
        if (Number.isNaN(d.getTime())) {
            throw new Error('Invalid record date');
        }
        recordDate = d.toISOString().slice(0, 10);
    }

    const pool = getPool();
    const memberCheck = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query('SELECT member_id FROM members WHERE member_id = @member_id');

    if (memberCheck.recordset.length === 0) {
        throw new Error('Member not found');
    }

    const insertResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .input('weight', sql.Decimal(5, 2), weight)
        .input('bmi', sql.Decimal(5, 2), bmi)
        .input('body_fat', sql.Decimal(5, 2), bodyFat)
        .input('muscle_mass', sql.Decimal(5, 2), muscleMass)
        .input('record_date', sql.Date, recordDate)
        .query(`
            INSERT INTO body_measurements (member_id, weight, bmi, body_fat, muscle_mass, record_date)
            VALUES (
                @member_id,
                @weight,
                @bmi,
                @body_fat,
                @muscle_mass,
                COALESCE(@record_date, CAST(GETDATE() AS DATE))
            );
            SELECT SCOPE_IDENTITY() AS measurement_id;
        `);

    return {
        measurement_id: insertResult.recordset[0].measurement_id,
        member_id: memberId,
        weight,
        bmi,
        body_fat: bodyFat,
        muscle_mass: muscleMass,
        record_date: recordDate || new Date().toISOString().slice(0, 10)
    };
}

async function getMemberDashboard(memberId) {
    const pool = getPool();

    const profileResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT member_id, full_name, email, phone, age, gender, fitness_goal, status, join_date
            FROM members
            WHERE member_id = @member_id
        `);

    if (profileResult.recordset.length === 0) {
        return null;
    }

    const profile = profileResult.recordset[0];

    const subscriptionResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT TOP 1
                ms.subscription_id,
                ms.start_date,
                ms.end_date,
                mp.plan_name,
                mp.price,
                mp.duration_months,
                mp.description,
                CASE WHEN CAST(GETDATE() AS DATE) > ms.end_date THEN 'expired' ELSE 'active' END AS subscription_status,
                DATEDIFF(day, CAST(GETDATE() AS DATE), ms.end_date) AS days_remaining
            FROM member_subscriptions ms
            JOIN membership_plans mp ON ms.plan_id = mp.plan_id
            WHERE ms.member_id = @member_id
            ORDER BY
                CASE WHEN ms.end_date >= CAST(GETDATE() AS DATE) THEN 0 ELSE 1 END,
                ms.start_date DESC
        `);

    const classesResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT
                c.class_id,
                c.class_name,
                c.schedule_date,
                c.schedule_time,
                t.name AS trainer_name,
                ce.enrollment_id
            FROM class_enrollments ce
            JOIN classes c ON ce.class_id = c.class_id
            LEFT JOIN trainers t ON c.trainer_id = t.trainer_id
            WHERE ce.member_id = @member_id
              AND c.schedule_date >= CAST(GETDATE() AS DATE)
            ORDER BY c.schedule_date, c.schedule_time
        `);

    const sessionsResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT
                ts.session_id,
                ts.session_date,
                ts.session_time,
                ts.status,
                t.name AS trainer_name
            FROM trainer_sessions ts
            LEFT JOIN trainers t ON ts.trainer_id = t.trainer_id
            WHERE ts.member_id = @member_id
              AND ts.session_date >= CAST(GETDATE() AS DATE)
            ORDER BY ts.session_date, ts.session_time
        `);

    const completedResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT COUNT(*) AS completed_last_30
            FROM trainer_sessions
            WHERE member_id = @member_id
              AND status = 'completed'
              AND session_date >= DATEADD(day, -30, CAST(GETDATE() AS DATE))
        `);

    const workoutPlans = await getWorkoutPlansForMember(memberId);

    const dietPlansResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
            SELECT
                dp.diet_plan_id,
                dp.trainer_id,
                t.name AS trainer_name,
                dp.calorie_target,
                dp.meal_schedule
            FROM diet_plans dp
            LEFT JOIN trainers t ON dp.trainer_id = t.trainer_id
            WHERE dp.member_id = @member_id
            ORDER BY dp.diet_plan_id DESC
        `);

    const bodyMeasurements = await getBodyMeasurementsForMember(memberId);
    const workoutLogs = await getWorkoutLogsForMember(memberId);
    const workoutLogStats = await getWorkoutLogStatsForMember(memberId);

    return {
        profile,
        subscription: subscriptionResult.recordset[0] || null,
        upcomingClasses: classesResult.recordset,
        upcomingSessions: sessionsResult.recordset,
        workoutPlans,
        dietPlans: dietPlansResult.recordset,
        bodyMeasurements,
        workoutLogs,
        workoutLogStats,
        stats: {
            completed_sessions_last_30: completedResult.recordset[0]?.completed_last_30 ?? 0
        }
    };
}

async function subscribeMember(memberId, planId, options = {}) {
    const { start_date, payment_method } = options;
    const pool = getPool();

    const memberCheck = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query('SELECT member_id FROM members WHERE member_id = @member_id');

    if (memberCheck.recordset.length === 0) {
        throw new Error('Member not found');
    }

    const planResult = await pool.request()
        .input('plan_id', sql.Int, planId)
        .query(`
            SELECT plan_id, plan_name, duration_months, price, description
            FROM membership_plans
            WHERE plan_id = @plan_id
        `);

    if (planResult.recordset.length === 0) {
        throw new Error('Plan not found');
    }

    const plan = planResult.recordset[0];
    const durationMonths = plan.duration_months;
    const price = plan.price;

    if (!durationMonths || durationMonths <= 0) {
        throw new Error('Plan has invalid duration');
    }

    let startDate = start_date;
    if (startDate) {
        const d = new Date(startDate);
        if (Number.isNaN(d.getTime())) {
            throw new Error('Invalid start date');
        }
        startDate = d.toISOString().slice(0, 10);
    } else {
        startDate = new Date().toISOString().slice(0, 10);
    }

    const allowedMethods = ['cash', 'card', 'online'];
    if (payment_method != null && payment_method !== '' && !allowedMethods.includes(payment_method)) {
        throw new Error('Payment method must be cash, card, or online');
    }

    const request = pool.request();
    request.input('member_id', sql.Int, memberId);
    request.input('plan_id', sql.Int, planId);
    request.input('start_date', sql.Date, startDate);
    request.input('duration_months', sql.Int, durationMonths);

        await request.query(`
            DELETE FROM member_subscriptions
            WHERE member_id = @member_id
              AND (
                  end_date >= CAST(GETDATE() AS DATE)
                  OR end_date >= @start_date
              )
        `);

    const insertSub = await request.query(`
        INSERT INTO member_subscriptions (member_id, plan_id, start_date, end_date)
        OUTPUT INSERTED.subscription_id, INSERTED.start_date, INSERTED.end_date
        VALUES (
            @member_id,
            @plan_id,
            @start_date,
            DATEADD(month, @duration_months, @start_date)
        )
    `);

    const row = insertSub.recordset[0];
    const subscriptionId = row.subscription_id;

    let payment = null;
    if (payment_method) {
        const payReq = pool.request();
        payReq.input('subscription_id', sql.Int, subscriptionId);
        payReq.input('amount', sql.Decimal(10, 2), price);
        payReq.input('payment_method', sql.VarChar(50), payment_method);
        const payIns = await payReq.query(`
            INSERT INTO payments (subscription_id, amount, payment_method, payment_date)
            OUTPUT INSERTED.payment_id
            VALUES (@subscription_id, @amount, @payment_method, CAST(GETDATE() AS DATE))
        `);
        payment = {
            payment_id: payIns.recordset[0].payment_id,
            amount: price,
            payment_method
        };
    }

    return {
        subscription_id: subscriptionId,
        member_id: memberId,
        plan_id: planId,
        plan_name: plan.plan_name,
        duration_months: durationMonths,
        price,
        description: plan.description,
        start_date: row.start_date,
        end_date: row.end_date,
        payment
    };
}

module.exports = {
    getMemberDashboard,
    subscribeMember,
    getBodyMeasurementsForMember,
    createBodyMeasurement,
    getWorkoutLogsForMember,
    createWorkoutLog,
    getWorkoutLogStatsForMember
};
