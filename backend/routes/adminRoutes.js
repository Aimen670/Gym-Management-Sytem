const express = require('express');
const router = express.Router();
const { getMembers, createMemberHandler, updateMemberHandler, deleteMemberHandler } = require('../controllers/memberController');
const {
    getPlansHandler,
    createPlanHandler,
    updatePlanHandler,
    deletePlanHandler
} = require('../controllers/planController');
const { getPaymentsHandler, createPaymentHandler, getPendingPaymentsHandler, getRevenueReportHandler, getAllSubscriptionsHandler } = require('../controllers/paymentController');
const {
    getClassesHandler,
    createClassHandler,
    updateClassHandler,
    deleteClassHandler
} = require('../controllers/classController');
const {
    getWorkoutPlansAdminHandler,
    createWorkoutPlanHandler,
    getWorkoutExercisesAdminHandler,
    createWorkoutExerciseHandler,
    updateWorkoutExerciseHandler,
    deleteWorkoutExerciseHandler
} = require('../controllers/workoutPlanController');
const {
    getEquipmentHandler,
    createEquipmentHandler,
    updateEquipmentHandler,
    deleteEquipmentHandler
} = require('../controllers/equipmentController');
const {
    getClassEnrollmentsHandler,
    enrollMemberHandler,
    unenrollMemberHandler
} = require('../controllers/enrollmentController');
const {
    getDietPlansAdminHandler,
    createDietPlanHandler,
    updateDietPlanHandler,
    deleteDietPlanHandler
} = require('../controllers/dietPlanController');
const { getAdminOverview } = require('../controllers/adminOverviewController');
const {
    getMemberDashboardHandler,
    getMembershipPlansBrowseHandler,
    subscribeMemberHandler,
    getMemberBodyMeasurementsHandler,
    createMemberBodyMeasurementHandler
} = require('../controllers/memberPortalController');

router.get('/admin/overview', getAdminOverview);

router.get('/membership-plans', getMembershipPlansBrowseHandler);
router.get('/member/:memberId/dashboard', getMemberDashboardHandler);
router.post('/member/:memberId/subscribe', subscribeMemberHandler);
router.get('/member/:memberId/body-measurements', getMemberBodyMeasurementsHandler);
router.post('/member/:memberId/body-measurements', createMemberBodyMeasurementHandler);

router.get('/admin/members', getMembers);
router.post('/admin/members', createMemberHandler);
router.put('/admin/members/:id', updateMemberHandler);
router.delete('/admin/members/:id', deleteMemberHandler);

router.get('/admin/plans', getPlansHandler);
router.post('/admin/plans', createPlanHandler);
router.put('/admin/plans/:id', updatePlanHandler);
router.delete('/admin/plans/:id', deletePlanHandler);

router.get('/admin/payments', getPaymentsHandler);
router.post('/admin/payments', createPaymentHandler);
router.get('/admin/payments/pending', getPendingPaymentsHandler);
router.get('/admin/payments/revenue-report', getRevenueReportHandler);
router.get('/admin/payments/subscriptions', getAllSubscriptionsHandler);

router.get('/admin/classes', getClassesHandler);
router.post('/admin/classes', createClassHandler);
router.put('/admin/classes/:id', updateClassHandler);
router.delete('/admin/classes/:id', deleteClassHandler);

router.get('/admin/classes/:classId/enrollments', getClassEnrollmentsHandler);
router.post('/admin/classes/:classId/enroll', enrollMemberHandler);
router.delete('/admin/enrollments/:enrollmentId', unenrollMemberHandler);

router.get('/admin/equipment', getEquipmentHandler);
router.post('/admin/equipment', createEquipmentHandler);
router.put('/admin/equipment/:id', updateEquipmentHandler);
router.delete('/admin/equipment/:id', deleteEquipmentHandler);

router.get('/admin/workout-plans', getWorkoutPlansAdminHandler);
router.post('/admin/workout-plans', createWorkoutPlanHandler);
router.get('/admin/workout-exercises', getWorkoutExercisesAdminHandler);
router.post('/admin/workout-exercises', createWorkoutExerciseHandler);
router.put('/admin/workout-exercises/:id', updateWorkoutExerciseHandler);
router.delete('/admin/workout-exercises/:id', deleteWorkoutExerciseHandler);

router.get('/admin/diet-plans', getDietPlansAdminHandler);
router.post('/admin/diet-plans', createDietPlanHandler);
router.put('/admin/diet-plans/:id', updateDietPlanHandler);
router.delete('/admin/diet-plans/:id', deleteDietPlanHandler);

module.exports = router;
