const express = require('express');
const router = express.Router();
const {
    getFitnessGoals,
    getFitnessGoalsByMember,
    createFitnessGoal,
    updateFitnessGoal,
    deleteFitnessGoal,
    getGoalProgress
} = require('../controllers/fitnessGoalController');

// GET /api/fitness-goals - Get all fitness goals
router.get('/fitness-goals', getFitnessGoals);

// GET /api/fitness-goals/member/:memberId - Get fitness goals for a specific member
router.get('/fitness-goals/member/:memberId', getFitnessGoalsByMember);

// POST /api/fitness-goals - Create a new fitness goal
router.post('/fitness-goals', createFitnessGoal);

// PUT /api/fitness-goals/:id - Update a fitness goal
router.put('/fitness-goals/:id', updateFitnessGoal);

// DELETE /api/fitness-goals/:id - Delete a fitness goal
router.delete('/fitness-goals/:id', deleteFitnessGoal);

// GET /api/fitness-goals/:id/progress - Get progress for a specific fitness goal
router.get('/fitness-goals/:id/progress', getGoalProgress);

module.exports = router;
