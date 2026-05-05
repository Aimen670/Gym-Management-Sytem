const { getWorkoutPlansAdmin, getWorkoutExercisesAdmin, createWorkoutPlan } = require('../models/workoutPlanModel');

async function getWorkoutPlansAdminHandler(req, res) {
  try {
    const plans = await getWorkoutPlansAdmin();
    res.json(plans);
  } catch (err) {
    console.error('Workout plans fetch error:', err);
    res.status(500).json({ error: 'Failed to load workout plans' });
  }
}

async function createWorkoutPlanHandler(req, res) {
  try {
    const created = await createWorkoutPlan(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error('Workout plan create error:', err);
    const msg = err.message || 'Failed to create workout plan';
    res.status(400).json({ error: msg });
  }
}

async function getWorkoutExercisesAdminHandler(req, res) {
  try {
    const exercises = await getWorkoutExercisesAdmin();
    res.json(exercises);
  } catch (err) {
    console.error('Workout exercises fetch error:', err);
    res.status(500).json({ error: 'Failed to load workout exercises' });
  }
}

module.exports = {
  getWorkoutPlansAdminHandler,
  createWorkoutPlanHandler,
  getWorkoutExercisesAdminHandler
};
