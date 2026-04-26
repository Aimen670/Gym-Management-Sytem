const { getAllMembers, updateMember } = require('../models/memberModel');

async function getMembers(req, res) {
    try {
        const members = await getAllMembers();
        res.json(members);
    } catch (err) {
        console.error('Members fetch error:', err);
        res.status(500).json({ error: 'Failed to load members' });
    }
}

async function updateMemberHandler(req, res) {
    try {
        const memberId = parseInt(req.params.id, 10);
        if (Number.isNaN(memberId)) {
            return res.status(400).json({ error: 'Invalid member id' });
        }

        const updated = await updateMember(memberId, req.body);
        res.json(updated);
    } catch (err) {
        console.error('Member update error:', err);
        const statusCode = err.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({ error: err.message });
    }
}

module.exports = {
    getMembers,
    updateMemberHandler
};
