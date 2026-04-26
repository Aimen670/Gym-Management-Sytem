const { getPlans, createPlan, updatePlan, deletePlan } = require('../models/planModel');

async function getPlansHandler(req, res) {
    try {
        const plans = await getPlans();
        res.json(plans);
    } catch (err) {
        console.error('Plan fetch error:', err);
        res.status(500).json({ error: 'Failed to load plans' });
    }
}

async function createPlanHandler(req, res) {
    try {
        const plan = await createPlan(req.body);
        res.status(201).json(plan);
    } catch (err) {
        console.error('Plan create error:', err);
        res.status(400).json({ error: err.message });
    }
}

async function updatePlanHandler(req, res) {
    try {
        const planId = parseInt(req.params.id, 10);
        if (Number.isNaN(planId)) {
            return res.status(400).json({ error: 'Invalid plan id' });
        }

        const plan = await updatePlan(planId, req.body);
        res.json(plan);
    } catch (err) {
        console.error('Plan update error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

async function deletePlanHandler(req, res) {
    try {
        const planId = parseInt(req.params.id, 10);
        if (Number.isNaN(planId)) {
            return res.status(400).json({ error: 'Invalid plan id' });
        }

        await deletePlan(planId);
        res.json({ success: true });
    } catch (err) {
        console.error('Plan delete error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

module.exports = {
    getPlansHandler,
    createPlanHandler,
    updatePlanHandler,
    deletePlanHandler
};
