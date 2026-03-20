const express = require('express');
const router = express.Router();
const { getDataHandler } = require('../controllers/dataController');

// GET all data from members table
router.get('/data', getDataHandler);

module.exports = router;