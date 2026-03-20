const { sql } = require('../db');

async function getAllData() {
    try {
        const result = await sql.query('SELECT full_name FROM members');
        return result.recordset;
    } catch (err) {
        console.error('Query failed:', err);
        throw err;
    }
}

module.exports = {
    getAllData
};