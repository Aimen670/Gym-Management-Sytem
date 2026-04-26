const express = require('express');
const router = express.Router();
const { getDataHandler } = require('../controllers/dataController');

// GET all data from members  (used to test if database connected )
router.get('/data', getDataHandler);

module.exports = router;
// This file defines the routes for data-related API endpoints. 
// It imports the getDataHandler function from the dataController 
// and sets up a GET route at /api/data to retrieve all data from the members table.