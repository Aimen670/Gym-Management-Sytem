const { getPool } = require('../db');

async function getAllData() {
    try {
        const pool = getPool();
        const result = await pool.request().query('SELECT * FROM members');
        return result.recordset;
    } catch (err) {
        console.error('Query failed:', err);
        throw err;
    }
}

module.exports = {
    getAllData
};