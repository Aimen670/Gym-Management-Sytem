const { sql, getPool } = require('../db');

function parsePositiveInteger(value) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
}

function parseTime(value) {
    if (value instanceof Date) {
        const hours = value.getHours().toString().padStart(2, '0');
        const minutes = value.getMinutes().toString().padStart(2, '0');
        const seconds = value.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    const hhmmMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
    if (hhmmMatch) {
        return `${hhmmMatch[1]}:${hhmmMatch[2]}:00`;
    }

    const hhmmssMatch = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.exec(trimmed);
    if (hhmmssMatch) {
        return trimmed;
    }

    return null;
}

function validateClassPayload(payload, requireSchedule = true) {
    const { class_name, trainer_id, schedule_date, schedule_time, capacity, plan_ids } = payload;

    if (!class_name || !String(class_name).trim()) {
        throw new Error('Class name is required');
    }

    if (requireSchedule) {
        if (!schedule_date) {
            throw new Error('Schedule date is required');
        }
        if (!schedule_time) {
            throw new Error('Schedule time is required');
        }
    }

    const parsedTime = schedule_time !== undefined && schedule_time !== null ? parseTime(schedule_time) : null;
    if (parsedTime == null) {
        throw new Error('Schedule time is required and must be in 24-hour HH:MM or HH:MM:SS format');
    }

    const capacityValue = parsePositiveInteger(capacity);
    if (capacityValue == null) {
        throw new Error('Capacity must be a positive integer');
    }

    let trainerId = null;
    if (trainer_id !== undefined && trainer_id !== null && trainer_id !== '') {
        trainerId = parsePositiveInteger(trainer_id);
        if (trainerId == null) {
            throw new Error('trainer_id must be a positive integer');
        }
    }

    let planIds;
    if (plan_ids !== undefined) {
        if (!Array.isArray(plan_ids)) {
            throw new Error('plan_ids must be an array of plan ids');
        }

        planIds = Array.from(new Set(plan_ids.map((planId) => {
            const parsed = parsePositiveInteger(planId);
            if (parsed == null) {
                throw new Error('Each plan_id must be a positive integer');
            }
            return parsed;
        })));
    }

    return {
        class_name: String(class_name).trim(),
        trainer_id: trainerId,
        schedule_date,
        schedule_time: parsedTime,
        capacity: capacityValue,
        plan_ids: planIds
    };
}

async function saveClassPlans(classId, planIds, transaction) {
    if (!planIds || planIds.length === 0) {
        return;
    }

    for (const planId of planIds) {
        await transaction.request()
            .input('class_id', sql.Int, classId)
            .input('plan_id', sql.Int, planId)
            .query(`
                IF NOT EXISTS (
                    SELECT 1 FROM class_plans WHERE class_id = @class_id AND plan_id = @plan_id
                )
                INSERT INTO class_plans (class_id, plan_id)
                VALUES (@class_id, @plan_id);
            `);
    }
}

async function getClassPlanIds(classId) {
    const pool = getPool();
    const result = await pool.request()
        .input('class_id', sql.Int, classId)
        .query('SELECT plan_id FROM class_plans WHERE class_id = @class_id');

    return result.recordset.map((row) => row.plan_id);
}

async function getClasses() {
    const pool = getPool();
    const result = await pool.request().query(`
        SELECT c.class_id, c.class_name, c.trainer_id, t.name AS trainer_name,
               c.schedule_date, c.schedule_time, c.capacity
        FROM classes c
        LEFT JOIN trainers t ON c.trainer_id = t.trainer_id
        ORDER BY c.class_id DESC
    `);

    const classes = result.recordset;
    if (classes.length === 0) {
        return [];
    }

    const classIds = classes.map((cls) => cls.class_id);
    const planResult = await pool.request().query(`
        SELECT class_id, plan_id
        FROM class_plans
        WHERE class_id IN (${classIds.join(',')})
    `);

    const planMap = new Map();
    planResult.recordset.forEach((row) => {
        const list = planMap.get(row.class_id) || [];
        list.push(row.plan_id);
        planMap.set(row.class_id, list);
    });

    return classes.map((classRow) => ({
        ...classRow,
        plan_ids: planMap.get(classRow.class_id) || []
    }));
}

async function createClass(payload) {
    const { class_name, trainer_id, schedule_date, schedule_time, capacity, plan_ids } = validateClassPayload(payload, true);
    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const request = transaction.request();
        request.input('class_name', sql.VarChar(100), class_name);
        request.input('trainer_id', sql.Int, trainer_id || null);
        request.input('schedule_date', sql.Date, schedule_date || null);
        request.input('schedule_time', sql.VarChar(8), schedule_time || null);
        request.input('capacity', sql.Int, capacity);

        const insertResult = await request.query(`
            INSERT INTO classes (class_name, trainer_id, schedule_date, schedule_time, capacity)
            VALUES (@class_name, @trainer_id, @schedule_date, @schedule_time, @capacity);
            SELECT SCOPE_IDENTITY() as class_id;
        `);

        const classId = insertResult.recordset[0].class_id;
        await saveClassPlans(classId, plan_ids, transaction);
        await transaction.commit();

        return {
            class_id: classId,
            class_name,
            trainer_id: trainer_id || null,
            schedule_date,
            schedule_time,
            capacity,
            plan_ids: plan_ids || []
        };
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
}

async function updateClass(classId, payload) {
    const pool = getPool();
    const existingResult = await pool.request()
        .input('class_id', sql.Int, classId)
        .query('SELECT class_name, trainer_id, schedule_date, schedule_time, capacity FROM classes WHERE class_id = @class_id');

    if (existingResult.recordset.length === 0) {
        throw new Error('Class not found');
    }

    const existing = existingResult.recordset[0];
    const mergedPayload = {
        class_name: payload.class_name !== undefined ? payload.class_name : existing.class_name,
        trainer_id: payload.trainer_id !== undefined ? payload.trainer_id : existing.trainer_id,
        schedule_date: payload.schedule_date !== undefined ? payload.schedule_date : existing.schedule_date,
        schedule_time: payload.schedule_time !== undefined ? payload.schedule_time : existing.schedule_time,
        capacity: payload.capacity !== undefined ? payload.capacity : existing.capacity,
        plan_ids: payload.plan_ids
    };

    const { class_name, trainer_id, schedule_date, schedule_time, capacity, plan_ids } = validateClassPayload(mergedPayload, true);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const request = transaction.request();
        request.input('class_id', sql.Int, classId);
        request.input('class_name', sql.VarChar(100), class_name);
        request.input('trainer_id', sql.Int, trainer_id || null);
        request.input('schedule_date', sql.Date, schedule_date || null);
        request.input('schedule_time', sql.VarChar(8), schedule_time || null);
        request.input('capacity', sql.Int, capacity);

        const updateResult = await request.query(`
            UPDATE classes
            SET class_name = @class_name,
                trainer_id = @trainer_id,
                schedule_date = @schedule_date,
                schedule_time = @schedule_time,
                capacity = @capacity
            WHERE class_id = @class_id
        `);

        if (updateResult.rowsAffected[0] === 0) {
            throw new Error('Class not found');
        }

        if (plan_ids !== undefined) {
            await transaction.request()
                .input('class_id', sql.Int, classId)
                .query('DELETE FROM class_plans WHERE class_id = @class_id');
            await saveClassPlans(classId, plan_ids, transaction);
        }

        await transaction.commit();

        const result = await pool.request()
            .input('class_id', sql.Int, classId)
            .query('SELECT class_id, class_name, trainer_id, schedule_date, schedule_time, capacity FROM classes WHERE class_id = @class_id');

        const updatedClass = result.recordset[0];
        updatedClass.plan_ids = await getClassPlanIds(classId);
        return updatedClass;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
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
