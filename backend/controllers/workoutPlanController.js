const {
  getWorkoutPlansAdmin,
  getWorkoutExercisesAdmin,
  createWorkoutPlan,
  createWorkoutExercise,
  updateWorkoutExercise,
  deleteWorkoutExercise
} = require('../models/workoutPlanModel');

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

async function createWorkoutExerciseHandler(req, res) {
  try {
    const created = await createWorkoutExercise(req.body);
    res.status(201).json(created);
  } catch (err) {
    console.error('Workout exercise create error:', err);
    res.status(400).json({ error: err.message || 'Failed to create exercise' });
  }
}

async function updateWorkoutExerciseHandler(req, res) {
  try {
    const exerciseId = parseInt(req.params.id, 10);
    if (Number.isNaN(exerciseId)) {
      return res.status(400).json({ error: 'Invalid exercise id' });
    }

    const updated = await updateWorkoutExercise(exerciseId, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Workout exercise update error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: err.message || 'Failed to update exercise' });
  }
}

async function deleteWorkoutExerciseHandler(req, res) {
  try {
    const exerciseId = parseInt(req.params.id, 10);
    if (Number.isNaN(exerciseId)) {
      return res.status(400).json({ error: 'Invalid exercise id' });
    }

    await deleteWorkoutExercise(exerciseId);
    res.json({ success: true });
  } catch (err) {
    console.error('Workout exercise delete error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({ error: err.message || 'Failed to delete exercise' });
  }
}

module.exports = {
  getWorkoutPlansAdminHandler,
  createWorkoutPlanHandler,
  getWorkoutExercisesAdminHandler,
  createWorkoutExerciseHandler,
  updateWorkoutExerciseHandler,
  deleteWorkoutExerciseHandler
};
