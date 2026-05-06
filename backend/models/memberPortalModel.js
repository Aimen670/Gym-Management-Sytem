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
            exercise_id,
            workout_plan_id,
            exercise_name,
            sets,
            reps,
            schedule_day
        FROM workout_exercises
        WHERE workout_plan_id IN (${idParams.join(', ')})
        ORDER BY workout_plan_id, schedule_day, exercise_name
    `);

    exercisesResult.recordset.forEach((row) => {
        const plan = planMap.get(row.workout_plan_id);
        if (plan) {
            plan.exercises.push(row);
        }
    });

    return plans;
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
                ms.end_date DESC
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

    return {
        profile,
        subscription: subscriptionResult.recordset[0] || null,
        upcomingClasses: classesResult.recordset,
        upcomingSessions: sessionsResult.recordset,
        workoutPlans,
        dietPlans: dietPlansResult.recordset,
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
    subscribeMember
};
