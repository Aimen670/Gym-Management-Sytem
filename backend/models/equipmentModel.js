const { sql, getPool } = require('../db');

async function getEquipment() {
    const pool = getPool();
    const result = await pool.request().query(
        'SELECT equipment_id, equipment_name, quantity, purchase_date, status FROM equipment ORDER BY equipment_id DESC'
    );
    return result.recordset;
}

async function createEquipment(item) {
    const { equipment_name, quantity, purchase_date, status } = item;

    if (!equipment_name) {
        throw new Error('Equipment name is required');
    }

    const pool = getPool();
    const request = pool.request();
    request.input('equipment_name', sql.VarChar(100), equipment_name);
    request.input('quantity', sql.Int, quantity || null);
    request.input('purchase_date', sql.Date, purchase_date || null);
    request.input('status', sql.VarChar(50), status || null);

    const insertResult = await request.query(`
        INSERT INTO equipment (equipment_name, quantity, purchase_date, status)
        VALUES (@equipment_name, @quantity, @purchase_date, @status);
        SELECT SCOPE_IDENTITY() as equipment_id;
    `);

    return {
        equipment_id: insertResult.recordset[0].equipment_id,
        equipment_name,
        quantity: quantity || null,
        purchase_date: purchase_date || null,
        status: status || null
    };
}

async function updateEquipment(equipmentId, item) {
    const { equipment_name, quantity, purchase_date, status } = item;

    if (!equipment_name) {
        throw new Error('Equipment name is required');
    }

    const pool = getPool();
    const request = pool.request();
    request.input('equipment_id', sql.Int, equipmentId);
    request.input('equipment_name', sql.VarChar(100), equipment_name);
    request.input('quantity', sql.Int, quantity || null);
    request.input('purchase_date', sql.Date, purchase_date || null);
    request.input('status', sql.VarChar(50), status || null);

    await request.query(`
        UPDATE equipment
        SET equipment_name = @equipment_name,
            quantity = @quantity,
            purchase_date = @purchase_date,
            status = @status
        WHERE equipment_id = @equipment_id
    `);

    const result = await pool.request()
        .input('equipment_id', sql.Int, equipmentId)
        .query('SELECT equipment_id, equipment_name, quantity, purchase_date, status FROM equipment WHERE equipment_id = @equipment_id');

    if (result.recordset.length === 0) {
        throw new Error('Equipment not found');
    }

    return result.recordset[0];
}

async function deleteEquipment(equipmentId) {
    const pool = getPool();
    const result = await pool.request()
        .input('equipment_id', sql.Int, equipmentId)
        .query('DELETE FROM equipment WHERE equipment_id = @equipment_id');

    if (result.rowsAffected[0] === 0) {
        throw new Error('Equipment not found');
    }

    return { success: true };
}

module.exports = {
    getEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
};
