const { sql, getPool } = require('../db');

async function getDietPlansAdmin() {
  const pool = getPool();
  const result = await pool.request().query(`
    SELECT
      dp.diet_plan_id,
      dp.member_id,
      m.full_name AS member_name,
      dp.trainer_id,
      t.name AS trainer_name,
      dp.calorie_target,
      dp.meal_schedule
    FROM diet_plans dp
    JOIN members m ON dp.member_id = m.member_id
    LEFT JOIN trainers t ON dp.trainer_id = t.trainer_id
    ORDER BY dp.diet_plan_id DESC
  `);
  return result.recordset;
}

async function createDietPlan(payload) {
  const memberId = parseInt(payload.member_id, 10);
  const trainerId = payload.trainer_id === '' || payload.trainer_id == null
    ? null
    : parseInt(payload.trainer_id, 10);
  const calorieTarget = parseInt(payload.calorie_target, 10);
  const mealSchedule = String(payload.meal_schedule || '').trim();

  if (Number.isNaN(memberId)) {
    throw new Error('member_id is required');
  }
  if (trainerId !== null && Number.isNaN(trainerId)) {
    throw new Error('Invalid trainer_id');
  }
  if (Number.isNaN(calorieTarget) || calorieTarget < 0) {
    throw new Error('Calorie target must be 0 or a positive number');
  }
  if (!mealSchedule) {
    throw new Error('Meal schedule is required');
  }

  const pool = getPool();
  const memberCheck = await pool.request()
    .input('member_id', sql.Int, memberId)
    .query('SELECT member_id FROM members WHERE member_id = @member_id');

  if (memberCheck.recordset.length === 0) {
    throw new Error('Member not found');
  }

  if (trainerId != null) {
    const trainerCheck = await pool.request()
      .input('trainer_id', sql.Int, trainerId)
      .query('SELECT trainer_id FROM trainers WHERE trainer_id = @trainer_id');
    if (trainerCheck.recordset.length === 0) {
      throw new Error('Trainer not found');
    }
  }

  const insertResult = await pool.request()
    .input('member_id', sql.Int, memberId)
    .input('trainer_id', sql.Int, trainerId)
    .input('calorie_target', sql.Int, calorieTarget)
    .input('meal_schedule', sql.Text, mealSchedule)
    .query(`
      INSERT INTO diet_plans (member_id, trainer_id, calorie_target, meal_schedule)
      VALUES (@member_id, @trainer_id, @calorie_target, @meal_schedule);
      SELECT SCOPE_IDENTITY() AS diet_plan_id;
    `);

  return {
    diet_plan_id: insertResult.recordset[0].diet_plan_id,
    member_id: memberId,
    trainer_id: trainerId,
    calorie_target: calorieTarget,
    meal_schedule: mealSchedule
  };
}

async function updateDietPlan(dietPlanId, payload) {
  const memberId = parseInt(payload.member_id, 10);
  const trainerId = payload.trainer_id === '' || payload.trainer_id == null
    ? null
    : parseInt(payload.trainer_id, 10);
  const calorieTarget = parseInt(payload.calorie_target, 10);
  const mealSchedule = String(payload.meal_schedule || '').trim();

  if (Number.isNaN(memberId)) {
    throw new Error('member_id is required');
  }
  if (trainerId !== null && Number.isNaN(trainerId)) {
    throw new Error('Invalid trainer_id');
  }
  if (Number.isNaN(calorieTarget) || calorieTarget < 0) {
    throw new Error('Calorie target must be 0 or a positive number');
  }
  if (!mealSchedule) {
    throw new Error('Meal schedule is required');
  }

  const pool = getPool();
  const memberCheck = await pool.request()
    .input('member_id', sql.Int, memberId)
    .query('SELECT member_id FROM members WHERE member_id = @member_id');

  if (memberCheck.recordset.length === 0) {
    throw new Error('Member not found');
  }

  if (trainerId != null) {
    const trainerCheck = await pool.request()
      .input('trainer_id', sql.Int, trainerId)
      .query('SELECT trainer_id FROM trainers WHERE trainer_id = @trainer_id');
    if (trainerCheck.recordset.length === 0) {
      throw new Error('Trainer not found');
    }
  }

  await pool.request()
    .input('diet_plan_id', sql.Int, dietPlanId)
    .input('member_id', sql.Int, memberId)
    .input('trainer_id', sql.Int, trainerId)
    .input('calorie_target', sql.Int, calorieTarget)
    .input('meal_schedule', sql.Text, mealSchedule)
    .query(`
      UPDATE diet_plans
      SET member_id = @member_id,
          trainer_id = @trainer_id,
          calorie_target = @calorie_target,
          meal_schedule = @meal_schedule
      WHERE diet_plan_id = @diet_plan_id
    `);

  const result = await pool.request()
    .input('diet_plan_id', sql.Int, dietPlanId)
    .query(`
      SELECT diet_plan_id, member_id, trainer_id, calorie_target, meal_schedule
      FROM diet_plans
      WHERE diet_plan_id = @diet_plan_id
    `);

  if (result.recordset.length === 0) {
    throw new Error('Diet plan not found');
  }

  return result.recordset[0];
}

async function deleteDietPlan(dietPlanId) {
  const pool = getPool();
  const result = await pool.request()
    .input('diet_plan_id', sql.Int, dietPlanId)
    .query('DELETE FROM diet_plans WHERE diet_plan_id = @diet_plan_id');

  if (result.rowsAffected[0] === 0) {
    throw new Error('Diet plan not found');
  }

  return { success: true };
}

module.exports = {
  getDietPlansAdmin,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan
};
