const { getClassEnrollments, enrollMember, unenrollMember } = require('../models/enrollmentModel');

async function getClassEnrollmentsHandler(req, res) {
    try {
        const classId = parseInt(req.params.classId, 10);
        if (Number.isNaN(classId)) {
            return res.status(400).json({ error: 'Invalid class id' });
        }

        const enrollments = await getClassEnrollments(classId);
        res.json(enrollments);
    } catch (err) {
        console.error('Get enrollments error:', err);
        res.status(500).json({ error: 'Failed to load enrollments' });
    }
}

async function enrollMemberHandler(req, res) {
    try {
        const classId = parseInt(req.params.classId, 10);
        const { member_id } = req.body;

        if (Number.isNaN(classId)) {
            return res.status(400).json({ error: 'Invalid class id' });
        }

        if (!member_id) {
            return res.status(400).json({ error: 'Member ID is required' });
        }

        const result = await enrollMember(classId, member_id);
        res.status(201).json(result);
    } catch (err) {
        console.error('Enroll member error:', err);
        const statusCode = err.message.includes('not found') || err.message.includes('already enrolled') || err.message.includes('full capacity') ? 400 : 500;
        res.status(statusCode).json({ error: err.message });
    }
}

async function unenrollMemberHandler(req, res) {
    try {
        const enrollmentId = parseInt(req.params.enrollmentId, 10);
        if (Number.isNaN(enrollmentId)) {
            return res.status(400).json({ error: 'Invalid enrollment id' });
        }

        await unenrollMember(enrollmentId);
        res.json({ success: true });
    } catch (err) {
        console.error('Unenroll member error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

module.exports = {
    getClassEnrollmentsHandler,
    enrollMemberHandler,
    unenrollMemberHandler
};