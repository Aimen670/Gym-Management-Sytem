const { getClasses, createClass, updateClass, deleteClass } = require('../models/classModel');

async function getClassesHandler(req, res) {
    try {
        const classes = await getClasses();
        res.json(classes);
    } catch (err) {
        console.error('Class fetch error:', err);
        res.status(500).json({ error: 'Failed to load classes' });
    }
}

async function createClassHandler(req, res) {
    try {
        const created = await createClass(req.body);
        res.status(201).json(created);
    } catch (err) {
        console.error('Class create error:', err);
        res.status(400).json({ error: err.message });
    }
}

async function updateClassHandler(req, res) {
    try {
        const classId = parseInt(req.params.id, 10);
        if (Number.isNaN(classId)) {
            return res.status(400).json({ error: 'Invalid class id' });
        }

        const updated = await updateClass(classId, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Class update error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

async function deleteClassHandler(req, res) {
    try {
        const classId = parseInt(req.params.id, 10);
        if (Number.isNaN(classId)) {
            return res.status(400).json({ error: 'Invalid class id' });
        }

        await deleteClass(classId);
        res.json({ success: true });
    } catch (err) {
        console.error('Class delete error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

module.exports = {
    getClassesHandler,
    createClassHandler,
    updateClassHandler,
    deleteClassHandler
};
