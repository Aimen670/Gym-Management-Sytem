const express = require('express');
const router = express.Router();
const {
    getClassEnrollmentsHandler,
    enrollMemberHandler,
    unenrollMemberHandler
} = require('../controllers/enrollmentController');

// GET /api/classes/:classId/enrollments - Get all enrollments for a specific class
router.get('/classes/:classId/enrollments', getClassEnrollmentsHandler);

// POST /api/classes/:classId/enroll - Enroll a member in a class
router.post('/classes/:classId/enroll', enrollMemberHandler);

// DELETE /api/enrollments/:enrollmentId - Unenroll a member from a class
router.delete('/enrollments/:enrollmentId', unenrollMemberHandler);

module.exports = router;
