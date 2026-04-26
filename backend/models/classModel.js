const { sql, getPool } = require('../db');

async function getClasses() {
    const pool = getPool();
    const result = await pool.request().query(
        'SELECT class_id, class_name, trainer_id, schedule_date, schedule_time, capacity FROM classes ORDER BY class_id DESC'
    );
    return result.recordset;
}

async function createClass(payload) {
    const { class_name, trainer_id, schedule_date, schedule_time, capacity } = payload;

    if (!class_name) {
        throw new Error('Class name is required');
    }

    const pool = getPool();
    const request = pool.request();
    request.input('class_name', sql.VarChar(100), class_name);
    request.input('trainer_id', sql.Int, trainer_id || null);
    request.input('schedule_date', sql.Date, schedule_date || null);
    request.input('schedule_time', sql.Time, schedule_time || null);
    request.input('capacity', sql.Int, capacity || null);

    const insertResult = await request.query(`
        INSERT INTO classes (class_name, trainer_id, schedule_date, schedule_time, capacity)
        VALUES (@class_name, @trainer_id, @schedule_date, @schedule_time, @capacity);
        SELECT SCOPE_IDENTITY() as class_id;
    `);

    return {
        class_id: insertResult.recordset[0].class_id,
        class_name,
        trainer_id: trainer_id || null,
        schedule_date: schedule_date || null,
        schedule_time: schedule_time || null,
        capacity: capacity || null
    };
}

async function updateClass(classId, payload) {
    const { class_name, trainer_id, schedule_date, schedule_time, capacity } = payload;

    if (!class_name) {
        throw new Error('Class name is required');
    }

    const pool = getPool();
    const request = pool.request();
    request.input('class_id', sql.Int, classId);
    request.input('class_name', sql.VarChar(100), class_name);
    request.input('trainer_id', sql.Int, trainer_id || null);
    request.input('schedule_date', sql.Date, schedule_date || null);
    request.input('schedule_time', sql.Time, schedule_time || null);
    request.input('capacity', sql.Int, capacity || null);

    await request.query(`
        UPDATE classes
        SET class_name = @class_name,
            trainer_id = @trainer_id,
            schedule_date = @schedule_date,
            schedule_time = @schedule_time,
            capacity = @capacity
        WHERE class_id = @class_id
    `);

    const result = await pool.request()
        .input('class_id', sql.Int, classId)
        .query('SELECT class_id, class_name, trainer_id, schedule_date, schedule_time, capacity FROM classes WHERE class_id = @class_id');

    if (result.recordset.length === 0) {
        throw new Error('Class not found');
    }

    return result.recordset[0];
}

async function deleteClass(classId) {
    const pool = getPool();
    const result = await pool.request()
        .input('class_id', sql.Int, classId)
        .query('DELETE FROM classes WHERE class_id = @class_id');

    if (result.rowsAffected[0] === 0) {
        throw new Error('Class not found');
    }

    return { success: true };
}

module.exports = {
    getClasses,
    createClass,
    updateClass,
    deleteClass
};
