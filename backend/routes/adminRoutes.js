const express = require('express');
const router = express.Router();
const { getMembers, updateMemberHandler } = require('../controllers/memberController');
const {
    getPlansHandler,
    createPlanHandler,
    updatePlanHandler,
    deletePlanHandler
} = require('../controllers/planController');
const { getPaymentsHandler, createPaymentHandler } = require('../controllers/paymentController');
const {
    getClassesHandler,
    createClassHandler,
    updateClassHandler,
    deleteClassHandler
} = require('../controllers/classController');
const {
    getEquipmentHandler,
    createEquipmentHandler,
    updateEquipmentHandler,
    deleteEquipmentHandler
} = require('../controllers/equipmentController');
const { getAdminOverview } = require('../controllers/adminOverviewController');

router.get('/admin/overview', getAdminOverview);

router.get('/admin/members', getMembers);
router.put('/admin/members/:id', updateMemberHandler);

router.get('/admin/plans', getPlansHandler);
router.post('/admin/plans', createPlanHandler);
router.put('/admin/plans/:id', updatePlanHandler);
router.delete('/admin/plans/:id', deletePlanHandler);

router.get('/admin/payments', getPaymentsHandler);
router.post('/admin/payments', createPaymentHandler);

router.get('/admin/classes', getClassesHandler);
router.post('/admin/classes', createClassHandler);
router.put('/admin/classes/:id', updateClassHandler);
router.delete('/admin/classes/:id', deleteClassHandler);

router.get('/admin/equipment', getEquipmentHandler);
router.post('/admin/equipment', createEquipmentHandler);
router.put('/admin/equipment/:id', updateEquipmentHandler);
router.delete('/admin/equipment/:id', deleteEquipmentHandler);

module.exports = router;
