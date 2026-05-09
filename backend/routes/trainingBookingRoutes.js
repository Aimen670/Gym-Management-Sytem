const express = require('express');
const router = express.Router();
const {
    getTrainerAvailableSlotsHandler,
    getAllTrainersAvailabilityHandler,
    createTrainerSessionBookingHandler,
    getMemberTrainerSessionsHandler,
    deleteTrainerSessionHandler
} = require('../controllers/trainingBookingController');

// Member booking flow
router.post('/member/:memberId/trainer-sessions', createTrainerSessionBookingHandler);
router.get('/member/:memberId/trainer-sessions', getMemberTrainerSessionsHandler);
router.delete('/member/:memberId/trainer-sessions/:sessionId', deleteTrainerSessionHandler);

// Availability browsing (public for members to view)
router.get('/trainers/availability', getAllTrainersAvailabilityHandler);
router.get('/trainers/:trainerId/available-slots', getTrainerAvailableSlotsHandler);

module.exports = router;

