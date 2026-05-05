const { sql, getPool } = require('../db');

const VALID_DAYS = new Set([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]);

function normalizeScheduleDay(value) {
  if (!value) return null;
  const day = String(value).trim().toLowerCase();
  if (!day) return null;
  if (!VALID_DAYS.has(day)) {
    throw new Error('Invalid schedule_day');
  }
  return day;
}

async function getWorkoutPlansAdmin() {
  const pool = getPool();
  const planResult = await pool.request().query(`
    SELECT
      wp.workout_plan_id,
      wp.member_id,
      m.full_name AS member_name,
      wp.trainer_id,
      t.name AS trainer_name,
      wp.created_date
    FROM workout_plans wp
    LEFT JOIN members m ON wp.member_id = m.member_id
    LEFT JOIN trainers t ON wp.trainer_id = t.trainer_id
    ORDER BY wp.created_date DESC, wp.workout_plan_id DESC
  `);

  if (planResult.recordset.length === 0) {
    return [];
  }

  const plans = planResult.recordset.map((row) => ({
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

async function getWorkoutExercisesAdmin() {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT
      we.exercise_id,
      we.workout_plan_id,
      wp.member_id,
      m.full_name AS member_name,
      wp.trainer_id,
      t.name AS trainer_name,
      we.exercise_name,
      we.sets,
      we.reps,
      we.schedule_day
    FROM workout_exercises we
    JOIN workout_plans wp ON we.workout_plan_id = wp.workout_plan_id
    LEFT JOIN members m ON wp.member_id = m.member_id
    LEFT JOIN trainers t ON wp.trainer_id = t.trainer_id
    ORDER BY we.exercise_id DESC
  `);
  return result.recordset;
}

async function createWorkoutPlan(payload) {
  const { member_id, trainer_id, exercises, exercise_ids } = payload || {};

  const memberId = parseInt(member_id, 10);
  if (Number.isNaN(memberId)) {
    throw new Error('member_id is required');
  }

  const trainerId = trainer_id === '' || trainer_id == null ? null : parseInt(trainer_id, 10);
  if (trainerId !== null && Number.isNaN(trainerId)) {
    throw new Error('Invalid trainer_id');
  }

  let normalizedExercises = [];
  let exerciseIds = [];

  if (Array.isArray(exercise_ids)) {
    exerciseIds = Array.from(
      new Set(
        exercise_ids
          .map((id) => parseInt(id, 10))
          .filter((id) => !Number.isNaN(id) && id > 0)
      )
    );
  }

  if (exerciseIds.length === 0 && Array.isArray(exercises)) {
    normalizedExercises = exercises.map((exercise) => {
      const name = String(exercise.exercise_name || '').trim();
      const sets = parseInt(exercise.sets, 10);
      const reps = parseInt(exercise.reps, 10);
      const scheduleDay = normalizeScheduleDay(exercise.schedule_day);

      if (!name) {
        throw new Error('Exercise name is required');
      }
      if (Number.isNaN(sets) || sets <= 0) {
        throw new Error('Sets must be a positive number');
      }
      if (Number.isNaN(reps) || reps <= 0) {
        throw new Error('Reps must be a positive number');
      }

      return {
        exercise_name: name,
        sets,
        reps,
        schedule_day: scheduleDay
      };
    });
  }

  if (exerciseIds.length === 0 && normalizedExercises.length === 0) {
    throw new Error('At least one exercise is required');
  }

  const pool = getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const insertPlan = await new sql.Request(transaction)
      .input('member_id', sql.Int, memberId)
      .input('trainer_id', sql.Int, trainerId)
      .query(`
        INSERT INTO workout_plans (member_id, trainer_id)
        OUTPUT INSERTED.workout_plan_id, INSERTED.member_id, INSERTED.trainer_id, INSERTED.created_date
        VALUES (@member_id, @trainer_id)
      `);

    const planRow = insertPlan.recordset[0];
    const planId = planRow.workout_plan_id;

    if (exerciseIds.length > 0) {
      const request = new sql.Request(transaction);
      const idParams = exerciseIds.map((id, idx) => {
        const key = `exercise_id_${idx}`;
        request.input(key, sql.Int, id);
        return `@${key}`;
      });

      const existingResult = await request.query(`
        SELECT exercise_name, sets, reps, schedule_day
        FROM workout_exercises
        WHERE exercise_id IN (${idParams.join(', ')})
      `);

      if (existingResult.recordset.length === 0) {
        throw new Error('No exercises found for selection');
      }

      normalizedExercises = existingResult.recordset.map((row) => ({
        exercise_name: row.exercise_name,
        sets: row.sets,
        reps: row.reps,
        schedule_day: normalizeScheduleDay(row.schedule_day)
      }));
    }

    for (const exercise of normalizedExercises) {
      await new sql.Request(transaction)
        .input('workout_plan_id', sql.Int, planId)
        .input('exercise_name', sql.VarChar(100), exercise.exercise_name)
        .input('sets', sql.Int, exercise.sets)
        .input('reps', sql.Int, exercise.reps)
        .input('schedule_day', sql.VarChar(20), exercise.schedule_day)
        .query(`
          INSERT INTO workout_exercises (workout_plan_id, exercise_name, sets, reps, schedule_day)
          VALUES (@workout_plan_id, @exercise_name, @sets, @reps, @schedule_day)
        `);
    }

    await transaction.commit();

    return {
      workout_plan_id: planId,
      member_id: planRow.member_id,
      trainer_id: planRow.trainer_id,
      created_date: planRow.created_date,
      exercises: normalizedExercises
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

module.exports = {
  getWorkoutPlansAdmin,
  getWorkoutExercisesAdmin,
  createWorkoutPlan
};
