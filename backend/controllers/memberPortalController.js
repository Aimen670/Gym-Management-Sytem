const {
    getMemberDashboard,
    subscribeMember,
    getBodyMeasurementsForMember,
    createBodyMeasurement
} = require('../models/memberPortalModel');
const { getPlansForBrowse } = require('../models/planModel');

async function getMemberDashboardHandler(req, res) {
    try {
        const memberId = parseInt(req.params.memberId, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member id' });
        }

        const data = await getMemberDashboard(memberId);
        if (!data) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json(data);
    } catch (err) {
        console.error('Member dashboard error:', err);
        res.status(500).json({ error: 'Failed to load member dashboard' });
    }
}

async function getMembershipPlansBrowseHandler(req, res) {
    try {
        const plans = await getPlansForBrowse();
        res.json(plans);
    } catch (err) {
        console.error('Membership plans browse error:', err);
        res.status(500).json({ error: 'Failed to load membership plans' });
    }
}

async function subscribeMemberHandler(req, res) {
    try {
        const memberId = parseInt(req.params.memberId, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member id' });
        }

        const planId = parseInt(req.body?.plan_id, 10);
        if (Number.isNaN(planId)) {
            return res.status(400).json({ error: 'plan_id is required' });
        }

        const { start_date, payment_method } = req.body || {};
        const result = await subscribeMember(memberId, planId, { start_date, payment_method });
        res.status(201).json(result);
    } catch (err) {
        console.error('Subscribe error:', err);
        const msg = err.message || 'Failed to create subscription';
        const status = msg.includes('not found') ? 404 : 400;
        res.status(status).json({ error: msg });
    }
}

async function getMemberBodyMeasurementsHandler(req, res) {
    try {
        const memberId = parseInt(req.params.memberId, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member id' });
        }

        const measurements = await getBodyMeasurementsForMember(memberId);
        res.json(measurements);
    } catch (err) {
        console.error('Body measurements fetch error:', err);
        res.status(500).json({ error: 'Failed to load body measurements' });
    }
}

async function createMemberBodyMeasurementHandler(req, res) {
    try {
        const memberId = parseInt(req.params.memberId, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member id' });
        }

        const created = await createBodyMeasurement(memberId, req.body || {});
        res.status(201).json(created);
    } catch (err) {
        console.error('Body measurement create error:', err);
        const status = err.message && err.message.includes('not found') ? 404 : 400;
        res.status(status).json({ error: err.message || 'Failed to create measurement' });
    }
}

module.exports = {
    getMemberDashboardHandler,
    getMembershipPlansBrowseHandler,
    subscribeMemberHandler,
    getMemberBodyMeasurementsHandler,
    createMemberBodyMeasurementHandler
};
