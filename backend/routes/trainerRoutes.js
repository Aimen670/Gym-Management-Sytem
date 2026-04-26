const express = require('express');
const router = express.Router();
const {
    getTrainers,
    createTrainerHandler,
    updateTrainerHandler,
    deleteTrainerHandler
} = require('../controllers/trainerController');

router.get('/trainers', getTrainers);
router.post('/trainers', createTrainerHandler);
router.put('/trainers/:id', updateTrainerHandler);
router.delete('/trainers/:id', deleteTrainerHandler);

module.exports = router;
