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

async function getExercisesCatalog() {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT exercise_id, exercise_name, description
    FROM exercises
    ORDER BY exercise_name
  `);
  return result.recordset;
}

async function createCatalogExercise(payload) {
  const name = String(payload.exercise_name || '').trim();
  const description = payload.description == null ? null : String(payload.description).trim();

  if (!name) {
    throw new Error('Exercise name is required');
  }

  const pool = getPool();
  const result = await pool.request()
    .input('exercise_name', sql.VarChar(100), name)
    .input('description', sql.Text, description)
    .query(`
      INSERT INTO exercises (exercise_name, description)
      VALUES (@exercise_name, @description);
      SELECT SCOPE_IDENTITY() AS exercise_id;
    `);

  return {
    exercise_id: result.recordset[0].exercise_id,
    exercise_name: name,
    description
  };
}

async function updateCatalogExercise(exerciseId, payload) {
  const name = String(payload.exercise_name || '').trim();
  const description = payload.description == null ? null : String(payload.description).trim();

  if (!name) {
    throw new Error('Exercise name is required');
  }

  const pool = getPool();
  await pool.request()
    .input('exercise_id', sql.Int, exerciseId)
    .input('exercise_name', sql.VarChar(100), name)
    .input('description', sql.Text, description)
    .query(`
      UPDATE exercises
      SET exercise_name = @exercise_name,
          description = @description
      WHERE exercise_id = @exercise_id
    `);

  const result = await pool.request()
    .input('exercise_id', sql.Int, exerciseId)
    .query(`
      SELECT exercise_id, exercise_name, description
      FROM exercises
      WHERE exercise_id = @exercise_id
    `);

  if (result.recordset.length === 0) {
    throw new Error('Exercise not found');
  }

  return result.recordset[0];
}

async function deleteCatalogExercise(exerciseId) {
  const pool = getPool();
  const usage = await pool.request()
    .input('exercise_id', sql.Int, exerciseId)
    .query('SELECT COUNT(*) AS total FROM workout_plan_exercises WHERE exercise_id = @exercise_id');

  if (usage.recordset[0].total > 0) {
    throw new Error('Exercise is used in workout plans');
  }

  const result = await pool.request()
    .input('exercise_id', sql.Int, exerciseId)
    .query('DELETE FROM exercises WHERE exercise_id = @exercise_id');

  if (result.rowsAffected[0] === 0) {
    throw new Error('Exercise not found');
  }

  return { success: true };
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
      wpe.plan_exercise_id AS exercise_id,
      wpe.workout_plan_id,
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

async function getWorkoutExercisesAdmin() {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT
      wpe.plan_exercise_id AS exercise_id,
      wpe.workout_plan_id,
      wp.member_id,
      m.full_name AS member_name,
      wp.trainer_id,
      t.name AS trainer_name,
      e.exercise_name,
      wpe.sets,
      wpe.reps,
      wpe.schedule_day
    FROM workout_plan_exercises wpe
    JOIN workout_plans wp ON wpe.workout_plan_id = wp.workout_plan_id
    JOIN exercises e ON wpe.exercise_id = e.exercise_id
    LEFT JOIN members m ON wp.member_id = m.member_id
    LEFT JOIN trainers t ON wp.trainer_id = t.trainer_id
    ORDER BY wpe.plan_exercise_id DESC
  `);
  return result.recordset;
}

async function createWorkoutExercise(payload) {
  const workoutPlanId = parseInt(payload.workout_plan_id, 10);
  const name = String(payload.exercise_name || '').trim();
  const sets = parseInt(payload.sets, 10);
  const reps = parseInt(payload.reps, 10);
  const scheduleDay = normalizeScheduleDay(payload.schedule_day);

  if (Number.isNaN(workoutPlanId) || workoutPlanId <= 0) {
    throw new Error('workout_plan_id is required');
  }
  if (!name) {
    throw new Error('Exercise name is required');
  }
  if (Number.isNaN(sets) || sets <= 0) {
    throw new Error('Sets must be a positive number');
  }
  if (Number.isNaN(reps) || reps <= 0) {
    throw new Error('Reps must be a positive number');
  }

  const pool = getPool();
  const planResult = await pool.request()
    .input('workout_plan_id', sql.Int, workoutPlanId)
    .query('SELECT workout_plan_id FROM workout_plans WHERE workout_plan_id = @workout_plan_id');

  if (planResult.recordset.length === 0) {
    throw new Error('Workout plan not found');
  }

  const exerciseResult = await pool.request()
    .input('exercise_name', sql.VarChar(100), name)
    .query(`
      SELECT exercise_id
      FROM exercises
      WHERE LOWER(exercise_name) = LOWER(@exercise_name)
    `);

  let exerciseId = exerciseResult.recordset[0]?.exercise_id;

  if (!exerciseId) {
    const insertExercise = await pool.request()
      .input('exercise_name', sql.VarChar(100), name)
      .query(`
        INSERT INTO exercises (exercise_name)
        VALUES (@exercise_name);
        SELECT SCOPE_IDENTITY() AS exercise_id;
      `);
    exerciseId = insertExercise.recordset[0].exercise_id;
  }

  const insertResult = await pool.request()
    .input('workout_plan_id', sql.Int, workoutPlanId)
    .input('exercise_id', sql.Int, exerciseId)
    .input('sets', sql.Int, sets)
    .input('reps', sql.Int, reps)
    .input('schedule_day', sql.VarChar(20), scheduleDay)
    .query(`
      INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, schedule_day)
      VALUES (@workout_plan_id, @exercise_id, @sets, @reps, @schedule_day);
      SELECT SCOPE_IDENTITY() AS exercise_id;
    `);

  return {
    exercise_id: insertResult.recordset[0].exercise_id,
    workout_plan_id: workoutPlanId,
    exercise_name: name,
    sets,
    reps,
    schedule_day: scheduleDay
  };
}

async function updateWorkoutExercise(exerciseId, payload) {
  const workoutPlanId = parseInt(payload.workout_plan_id, 10);
  const name = String(payload.exercise_name || '').trim();
  const sets = parseInt(payload.sets, 10);
  const reps = parseInt(payload.reps, 10);
  const scheduleDay = normalizeScheduleDay(payload.schedule_day);

  if (Number.isNaN(workoutPlanId) || workoutPlanId <= 0) {
    throw new Error('workout_plan_id is required');
  }
  if (!name) {
    throw new Error('Exercise name is required');
  }
  if (Number.isNaN(sets) || sets <= 0) {
    throw new Error('Sets must be a positive number');
  }
  if (Number.isNaN(reps) || reps <= 0) {
    throw new Error('Reps must be a positive number');
  }

  const pool = getPool();
  const planResult = await pool.request()
    .input('workout_plan_id', sql.Int, workoutPlanId)
    .query('SELECT workout_plan_id FROM workout_plans WHERE workout_plan_id = @workout_plan_id');

  if (planResult.recordset.length === 0) {
    throw new Error('Workout plan not found');
  }

  const exerciseResult = await pool.request()
    .input('exercise_name', sql.VarChar(100), name)
    .query(`
      SELECT exercise_id
      FROM exercises
      WHERE LOWER(exercise_name) = LOWER(@exercise_name)
    `);

  let catalogExerciseId = exerciseResult.recordset[0]?.exercise_id;

  if (!catalogExerciseId) {
    const insertExercise = await pool.request()
      .input('exercise_name', sql.VarChar(100), name)
      .query(`
        INSERT INTO exercises (exercise_name)
        VALUES (@exercise_name);
        SELECT SCOPE_IDENTITY() AS exercise_id;
      `);
    catalogExerciseId = insertExercise.recordset[0].exercise_id;
  }

  await pool.request()
    .input('plan_exercise_id', sql.Int, exerciseId)
    .input('workout_plan_id', sql.Int, workoutPlanId)
    .input('exercise_id', sql.Int, catalogExerciseId)
    .input('sets', sql.Int, sets)
    .input('reps', sql.Int, reps)
    .input('schedule_day', sql.VarChar(20), scheduleDay)
    .query(`
      UPDATE workout_plan_exercises
      SET workout_plan_id = @workout_plan_id,
          exercise_id = @exercise_id,
          sets = @sets,
          reps = @reps,
          schedule_day = @schedule_day
      WHERE plan_exercise_id = @plan_exercise_id
    `);

  const result = await pool.request()
    .input('plan_exercise_id', sql.Int, exerciseId)
    .query(`
      SELECT
        wpe.plan_exercise_id AS exercise_id,
        wpe.workout_plan_id,
        e.exercise_name,
        wpe.sets,
        wpe.reps,
        wpe.schedule_day
      FROM workout_plan_exercises wpe
      JOIN exercises e ON wpe.exercise_id = e.exercise_id
      WHERE wpe.plan_exercise_id = @plan_exercise_id
    `);

  if (result.recordset.length === 0) {
    throw new Error('Exercise not found');
  }

  return result.recordset[0];
}

async function deleteWorkoutExercise(exerciseId) {
  const pool = getPool();
  const result = await pool.request()
    .input('plan_exercise_id', sql.Int, exerciseId)
    .query('DELETE FROM workout_plan_exercises WHERE plan_exercise_id = @plan_exercise_id');

  if (result.rowsAffected[0] === 0) {
    throw new Error('Exercise not found');
  }

  return { success: true };
}

async function createWorkoutPlan(payload) {
  const { member_id, trainer_id, exercises } = payload || {};

  const memberId = parseInt(member_id, 10);
  if (Number.isNaN(memberId)) {
    throw new Error('member_id is required');
  }

  const trainerId = trainer_id === '' || trainer_id == null ? null : parseInt(trainer_id, 10);
  if (trainerId !== null && Number.isNaN(trainerId)) {
    throw new Error('Invalid trainer_id');
  }

  let normalizedExercises = [];

  if (Array.isArray(exercises)) {
    normalizedExercises = exercises.map((exercise) => {
      const exerciseId = parseInt(exercise.exercise_id, 10);
      const sets = parseInt(exercise.sets, 10);
      const reps = parseInt(exercise.reps, 10);
      const scheduleDay = normalizeScheduleDay(exercise.schedule_day);

      if (Number.isNaN(exerciseId) || exerciseId <= 0) {
        throw new Error('exercise_id is required');
      }
      if (Number.isNaN(sets) || sets <= 0) {
        throw new Error('Sets must be a positive number');
      }
      if (Number.isNaN(reps) || reps <= 0) {
        throw new Error('Reps must be a positive number');
      }

      return {
        exercise_id: exerciseId,
        sets,
        reps,
        schedule_day: scheduleDay
      };
    });
  }

  if (normalizedExercises.length === 0) {
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

    const uniqueExerciseIds = Array.from(
      new Set(normalizedExercises.map((exercise) => exercise.exercise_id))
    );

    const verifyRequest = new sql.Request(transaction);
    const verifyParams = uniqueExerciseIds.map((id, idx) => {
      const key = `exercise_id_${idx}`;
      verifyRequest.input(key, sql.Int, id);
      return `@${key}`;
    });

    const verifyResult = await verifyRequest.query(`
      SELECT exercise_id
      FROM exercises
      WHERE exercise_id IN (${verifyParams.join(', ')})
    `);

    if (verifyResult.recordset.length !== uniqueExerciseIds.length) {
      throw new Error('One or more exercises not found');
    }

    for (const exercise of normalizedExercises) {
      await new sql.Request(transaction)
        .input('workout_plan_id', sql.Int, planId)
        .input('exercise_id', sql.Int, exercise.exercise_id)
        .input('sets', sql.Int, exercise.sets)
        .input('reps', sql.Int, exercise.reps)
        .input('schedule_day', sql.VarChar(20), exercise.schedule_day)
        .query(`
          INSERT INTO workout_plan_exercises (workout_plan_id, exercise_id, sets, reps, schedule_day)
          VALUES (@workout_plan_id, @exercise_id, @sets, @reps, @schedule_day)
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
  getExercisesCatalog,
  createCatalogExercise,
  updateCatalogExercise,
  deleteCatalogExercise,
  getWorkoutPlansAdmin,
  getWorkoutExercisesAdmin,
  createWorkoutPlan,
  createWorkoutExercise,
  updateWorkoutExercise,
  deleteWorkoutExercise
};
