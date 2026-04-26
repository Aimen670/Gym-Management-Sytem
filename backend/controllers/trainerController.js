const {
    getAllTrainers,
    createTrainer,
    updateTrainer,
    deleteTrainer
} = require('../models/trainerModel');

async function getTrainers(req, res) {
    try {
        const trainers = await getAllTrainers();
        res.json(trainers);
    } catch (err) {
        console.error('Trainer fetch error:', err);
        res.status(500).json({ error: 'Failed to load trainers' });
    }
}

async function createTrainerHandler(req, res) {
    try {
        const trainer = await createTrainer(req.body);
        res.status(201).json(trainer);
    } catch (err) {
        console.error('Trainer create error:', err);
        res.status(400).json({ error: err.message });
    }
}

async function updateTrainerHandler(req, res) {
    try {
        const trainerId = parseInt(req.params.id, 10);
        if (Number.isNaN(trainerId)) {
            return res.status(400).json({ error: 'Invalid trainer id' });
        }

        const updated = await updateTrainer(trainerId, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Trainer update error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

async function deleteTrainerHandler(req, res) {
    try {
        const trainerId = parseInt(req.params.id, 10);
        if (Number.isNaN(trainerId)) {
            return res.status(400).json({ error: 'Invalid trainer id' });
        }

        await deleteTrainer(trainerId);
        res.json({ success: true });
    } catch (err) {
        console.error('Trainer delete error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

module.exports = {
    getTrainers,
    createTrainerHandler,
    updateTrainerHandler,
    deleteTrainerHandler
};
