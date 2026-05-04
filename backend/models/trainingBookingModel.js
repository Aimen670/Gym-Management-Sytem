const { sql, getPool } = require('../db');

function parseISODate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) return null;
    const d = new Date(`${dateStr}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : dateStr.trim();
}

function coerceDateTime(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function toTimeHHMM(dt) {
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

function normalizeDbTimeToHHMM(value) {
    if (value == null) return null;

    // mssql can return TIME as a JS Date on some drivers/configs
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return toTimeHHMM(value);
    }

    const s = String(value).trim();
    // Common SQL Server TIME string shapes: "10:00:00", "10:00:00.0000000"
    const m = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(s);
    if (m) {
        const hh = String(parseInt(m[1], 10)).padStart(2, '0');
        const mm = m[2].slice(0, 2);
        return `${hh}:${mm}`;
    }

    return null;
}

function hhmmToSqlTime(hhmm) {
    if (typeof hhmm !== 'string') return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!m) return null;
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;

    // The mssql driver accepts a Date for sql.Time; using a Date avoids string parsing edge cases.
    const d = new Date('1970-01-01T00:00:00.000Z');
    d.setUTCHours(hh, mm, 0, 0);
    return d;
}

async function getTrainerBookedSessions(trainerId, dateStr) {
    const date = parseISODate(dateStr);
    if (!date) {
        throw new Error('date must be YYYY-MM-DD');
    }
    const pool = getPool();
    const req = pool.request();
    req.input('trainer_id', sql.Int, trainerId);
    req.input('session_date', sql.Date, date);

    const result = await req.query(`
        SELECT session_id, member_id, session_date, session_time, status
        FROM trainer_sessions
        WHERE trainer_id = @trainer_id
          AND session_date = @session_date
          AND status = 'scheduled'
        ORDER BY session_time ASC
    `);

    return result.recordset;
}

function generateFixedSlots(dateStr, startHour = 9, endHour = 17, stepMinutes = 60) {
    // Generates [startHour, endHour) slots, e.g. 09:00 ... 16:00 for endHour=17
    const date = parseISODate(dateStr);
    if (!date) throw new Error('date must be YYYY-MM-DD');
    const slots = [];
    const cursor = new Date(`${date}T00:00:00`);
    cursor.setHours(startHour, 0, 0, 0);

    const end = new Date(`${date}T00:00:00`);
    end.setHours(endHour, 0, 0, 0);

    while (cursor < end) {
        const start_time = toTimeHHMM(cursor);
        const next = new Date(cursor.getTime() + stepMinutes * 60 * 1000);
        const end_time = toTimeHHMM(next);
        slots.push({ start_time, end_time });
        cursor.setTime(next.getTime());
    }

    return slots;
}

async function getTrainerAvailableSlots(trainerId, dateStr, _durationMinutesIgnored, stepMinutes = 60) {
    const date = parseISODate(dateStr);
    if (!date) throw new Error('date must be YYYY-MM-DD');

    // Availability without DB changes:
    // Trainers are considered available on fixed gym hours (default 09:00–17:00),
    // and a slot is available if there isn't already a scheduled session at that exact time.
    const sessions = await getTrainerBookedSessions(trainerId, date);
    const bookedTimes = new Set(
        sessions.map((s) => normalizeDbTimeToHHMM(s.session_time)).filter(Boolean)
    );

    const allSlots = generateFixedSlots(date, 9, 17, stepMinutes);
    const slots = allSlots.filter((s) => !bookedTimes.has(s.start_time));

    return {
        trainer_id: trainerId,
        date,
        slots
    };
}

async function getAllTrainersAvailability(dateStr, stepMinutes = 60) {
    const date = parseISODate(dateStr);
    if (!date) throw new Error('date must be YYYY-MM-DD');

    const pool = getPool();

    const trainersResult = await pool.request().query(`
        SELECT trainer_id
        FROM trainers
        ORDER BY trainer_id ASC
    `);

    const trainerIds = trainersResult.recordset.map((r) => r.trainer_id);

    const sessionsReq = pool.request();
    sessionsReq.input('session_date', sql.Date, date);
    const sessionsResult = await sessionsReq.query(`
        SELECT trainer_id, session_time
        FROM trainer_sessions
        WHERE session_date = @session_date
          AND status = 'scheduled'
    `);

    const bookedByTrainer = new Map();
    for (const row of sessionsResult.recordset) {
        const tid = row.trainer_id;
        const t = normalizeDbTimeToHHMM(row.session_time);
        if (!t) continue;
        if (!bookedByTrainer.has(tid)) bookedByTrainer.set(tid, new Set());
        bookedByTrainer.get(tid).add(t);
    }

    const allSlots = generateFixedSlots(date, 9, 17, stepMinutes);

    const trainers = trainerIds.map((trainer_id) => {
        const bookedTimes = bookedByTrainer.get(trainer_id) || new Set();
        const slots = allSlots.filter((s) => !bookedTimes.has(s.start_time));
        return {
            trainer_id,
            date,
            slots,
            slot_count: slots.length
        };
    });

    return {
        date,
        gym_hours: { start: '09:00', end: '17:00', step_minutes: stepMinutes },
        trainers
    };
}

async function createTrainerSessionBooking(memberId, payload) {
    const trainerId = parseInt(payload?.trainer_id, 10);
    if (Number.isNaN(trainerId)) throw new Error('trainer_id is required');

    const startDt = coerceDateTime(payload?.start_datetime);
    if (!startDt) throw new Error('start_datetime must be a valid ISO datetime');

    const sessionDate = startDt.toISOString().slice(0, 10);
    const sessionTime = toTimeHHMM(startDt);
    const sessionTimeSql = hhmmToSqlTime(sessionTime);
    if (!sessionTimeSql) {
        throw new Error('start_datetime produced an invalid time');
    }

    const pool = getPool();

    // Ensure member exists
    const memberCheck = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query('SELECT member_id FROM members WHERE member_id = @member_id');
    if (memberCheck.recordset.length === 0) throw new Error('Member not found');

    // Ensure trainer exists
    const trainerCheck = await pool.request()
        .input('trainer_id', sql.Int, trainerId)
        .query('SELECT trainer_id FROM trainers WHERE trainer_id = @trainer_id');
    if (trainerCheck.recordset.length === 0) throw new Error('Trainer not found');

    // Enforce fixed working hours availability (09:00–17:00). No SQL schema changes required.
    const hour = startDt.getHours();
    const minute = startDt.getMinutes();
    if (hour < 9 || hour >= 17) {
        throw new Error('Trainer is not available at the selected time');
    }
    if (minute !== 0) {
        throw new Error('Please book on the hour (e.g. 10:00, 11:00)');
    }

    // Prevent conflicts (no overlaps possible without duration; block same exact time)
    const conflictReq = pool.request();
    conflictReq.input('trainer_id', sql.Int, trainerId);
    conflictReq.input('member_id', sql.Int, memberId);
    conflictReq.input('session_date', sql.Date, sessionDate);
    conflictReq.input('session_time', sql.Time(0), sessionTimeSql);
    const conflicts = await conflictReq.query(`
        SELECT TOP 1 session_id
        FROM trainer_sessions
        WHERE status = 'scheduled'
          AND session_date = @session_date
          AND session_time = @session_time
          AND (trainer_id = @trainer_id OR member_id = @member_id)
    `);
    if (conflicts.recordset.length > 0) {
        throw new Error('Scheduling conflict: please choose a different time');
    }

    const insertReq = pool.request();
    insertReq.input('member_id', sql.Int, memberId);
    insertReq.input('trainer_id', sql.Int, trainerId);
    insertReq.input('session_date', sql.Date, sessionDate);
    insertReq.input('session_time', sql.Time(0), sessionTimeSql);

    const inserted = await insertReq.query(`
        INSERT INTO trainer_sessions (member_id, trainer_id, session_date, session_time, status)
        OUTPUT INSERTED.session_id, INSERTED.member_id, INSERTED.trainer_id, INSERTED.session_date,
               INSERTED.session_time, INSERTED.status
        VALUES (@member_id, @trainer_id, @session_date, @session_time, 'scheduled')
    `);

    return inserted.recordset[0];
}

module.exports = {
    getTrainerAvailableSlots,
    getAllTrainersAvailability,
    createTrainerSessionBooking
};

