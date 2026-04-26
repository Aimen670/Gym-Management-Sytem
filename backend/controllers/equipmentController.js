const { getEquipment, createEquipment, updateEquipment, deleteEquipment } = require('../models/equipmentModel');

async function getEquipmentHandler(req, res) {
    try {
        const equipment = await getEquipment();
        res.json(equipment);
    } catch (err) {
        console.error('Equipment fetch error:', err);
        res.status(500).json({ error: 'Failed to load equipment' });
    }
}

async function createEquipmentHandler(req, res) {
    try {
        const created = await createEquipment(req.body);
        res.status(201).json(created);
    } catch (err) {
        console.error('Equipment create error:', err);
        res.status(400).json({ error: err.message });
    }
}

async function updateEquipmentHandler(req, res) {
    try {
        const equipmentId = parseInt(req.params.id, 10);
        if (Number.isNaN(equipmentId)) {
            return res.status(400).json({ error: 'Invalid equipment id' });
        }

        const updated = await updateEquipment(equipmentId, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Equipment update error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

async function deleteEquipmentHandler(req, res) {
    try {
        const equipmentId = parseInt(req.params.id, 10);
        if (Number.isNaN(equipmentId)) {
            return res.status(400).json({ error: 'Invalid equipment id' });
        }

        await deleteEquipment(equipmentId);
        res.json({ success: true });
    } catch (err) {
        console.error('Equipment delete error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

module.exports = {
    getEquipmentHandler,
    createEquipmentHandler,
    updateEquipmentHandler,
    deleteEquipmentHandler
};
