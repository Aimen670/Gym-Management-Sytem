const express = require('express');
const router = express.Router();

// TEMP TEST ROUTES (add these first)

router.get('/admin/overview', (req, res) => {
    res.json({ message: 'Overview working' });
});

router.get('/admin/plans', (req, res) => {
    res.json([]);
});

router.get('/admin/classes', (req, res) => {
    res.json([]);
});

router.get('/admin/equipment', (req, res) => {
    res.json([]);
});

router.get('/admin/payments', (req, res) => {
    res.json([]);
});

module.exports = router;