const express = require('express');
const router = express.Router();
const { getDataHandler } = require('../controllers/dataController');

// GET all data from members  (used to test if database connected )
router.get('/data', getDataHandler);

module.exports = router;
