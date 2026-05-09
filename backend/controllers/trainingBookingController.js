const {
    getTrainerAvailableSlots,
    getAllTrainersAvailability,
    createTrainerSessionBooking,
    getMemberTrainerSessions,
    deleteTrainerSession
} = require('../models/trainingBookingModel');

async function getTrainerAvailableSlotsHandler(req, res) {
    try {
        const trainerId = parseInt(req.params.trainerId, 10);
        if (Number.isNaN(trainerId)) {
            return res.status(400).json({ error: 'Invalid trainer id' });
        }
        const { date, duration_minutes } = req.query || {};
        const data = await getTrainerAvailableSlots(trainerId, date, duration_minutes ?? 60);
        res.json(data);
    } catch (err) {
        console.error('Trainer slots error:', err);
        res.status(400).json({ error: err.message || 'Failed to load available slots' });
    }
}

async function getAllTrainersAvailabilityHandler(req, res) {
    try {
        const { date, step_minutes } = req.query || {};
        const step = step_minutes != null ? parseInt(step_minutes, 10) : 60;
        if (!Number.isFinite(step) || step <= 0 || step > 24 * 60) {
            return res.status(400).json({ error: 'Invalid step_minutes' });
        }
        const data = await getAllTrainersAvailability(date, step);
        res.json(data);
    } catch (err) {
        console.error('All trainers availability error:', err);
        res.status(400).json({ error: err.message || 'Failed to load trainer availability' });
    }
}

async function createTrainerSessionBookingHandler(req, res) {
    try {
        const memberId = parseInt(req.params.memberId, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member id' });
        }
        const inserted = await createTrainerSessionBooking(memberId, req.body || {});
        res.status(201).json(inserted);
    } catch (err) {
        console.error('Create booking error:', err);
        const msg = err.message || 'Failed to create booking';
        const status = msg.includes('not found') ? 404 : 400;
        res.status(status).json({ error: msg });
    }
}

async function getMemberTrainerSessionsHandler(req, res) {
    try {
        const memberId = parseInt(req.params.memberId, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member id' });
        }
        const sessions = await getMemberTrainerSessions(memberId);
        res.json(sessions);
    } catch (err) {
        console.error('Get member sessions error:', err);
        res.status(500).json({ error: err.message || 'Failed to load sessions' });
    }
}

async function deleteTrainerSessionHandler(req, res) {
    try {
        const sessionId = parseInt(req.params.sessionId, 10);
        if (Number.isNaN(sessionId)) {
            return res.status(400).json({ error: 'Invalid session id' });
        }
        await deleteTrainerSession(sessionId);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete session error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message || 'Failed to delete session' });
    }
}

module.exports = {
    getTrainerAvailableSlotsHandler,
    getAllTrainersAvailabilityHandler,
    createTrainerSessionBookingHandler,
    getMemberTrainerSessionsHandler,
    deleteTrainerSessionHandler
};

