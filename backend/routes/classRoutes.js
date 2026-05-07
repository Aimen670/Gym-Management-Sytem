const express = require('express');
const router = express.Router();
const {
    getClassesHandler,
    createClassHandler,
    updateClassHandler,
    deleteClassHandler
} = require('../controllers/classController');

// GET /api/classes - Get all classes
router.get('/classes', getClassesHandler);

// POST /api/classes - Create a new class
router.post('/classes', createClassHandler);

// PUT /api/classes/:id - Update a class
router.put('/classes/:id', updateClassHandler);

// DELETE /api/classes/:id - Delete a class
router.delete('/classes/:id', deleteClassHandler);

module.exports = router;
