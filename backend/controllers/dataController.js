const { getAllData } = require('../models/dataModel');//

async function getDataHandler(req, res) {//
    try {
        const data = await getAllData();
        // getAllData is a function in dataModel that retrieves all data from the members table in the database.
        res.json(data);
    } catch (err) {
        console.error('Controller error:', err);
        res.status(500).json({ error: 'Database query failed' });
    }
}

module.exports = {
    getDataHandler
};