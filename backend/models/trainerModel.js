const { sql, getPool } = require('../db');

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^\d{11}$/;
    return phoneRegex.test(phone);
}

function validateExperience(experienceYears) {
    if (experienceYears === null || experienceYears === undefined || experienceYears === '') {
        return true;
    }
    const years = parseInt(experienceYears, 10);
    return !Number.isNaN(years) && years >= 0;
}

async function getAllTrainers() {
    try {
        const pool = getPool();
        const result = await pool.request().query(
            'SELECT trainer_id, name, specialization, phone, email, experience_years FROM trainers ORDER BY trainer_id DESC'
        );
        return result.recordset;
    } catch (err) {
        console.error('Query failed:', err);
        throw err;
    }
}

async function createTrainer(trainer) {
    const { name, specialization, phone, email, experience_years } = trainer;

    if (!name || name.trim().length === 0) {
        throw new Error('Trainer name is required');
    }

    if (email && !validateEmail(email)) {
        throw new Error('Invalid email format');
    }

    if (phone && !validatePhone(phone)) {
        throw new Error('Phone must be exactly 11 digits (numeric only)');
    }

    if (!validateExperience(experience_years)) {
        throw new Error('Experience must be a non-negative number');
    }

    try {
        const pool = getPool();
        const request = pool.request();
        request.input('name', sql.VarChar(100), name.trim());
        request.input('specialization', sql.VarChar(100), specialization || null);
        request.input('phone', sql.VarChar(20), phone || null);
        request.input('email', sql.VarChar(100), email || null);
        request.input('experience_years', sql.Int, experience_years === '' ? null : experience_years);

        const insertResult = await request.query(`
            INSERT INTO trainers (name, specialization, phone, email, experience_years)
            VALUES (@name, @specialization, @phone, @email, @experience_years);
            SELECT SCOPE_IDENTITY() as trainer_id;
        `);

        return {
            trainer_id: insertResult.recordset[0].trainer_id,
            name: name.trim(),
            specialization: specialization || null,
            phone: phone || null,
            email: email || null,
            experience_years: experience_years === '' ? null : experience_years
        };
    } catch (err) {
        console.error('Insert failed:', err);
        throw err;
    }
}

async function updateTrainer(trainerId, updates) {
    const { name, specialization, phone, email, experience_years } = updates;

    if (!name || name.trim().length === 0) {
        throw new Error('Trainer name is required');
    }

    if (email && !validateEmail(email)) {
        throw new Error('Invalid email format');
    }

    if (phone && !validatePhone(phone)) {
        throw new Error('Phone must be exactly 11 digits (numeric only)');
    }

    if (!validateExperience(experience_years)) {
        throw new Error('Experience must be a non-negative number');
    }

    try {
        const pool = getPool();
        const request = pool.request();
        request.input('trainer_id', sql.Int, trainerId);
        request.input('name', sql.VarChar(100), name.trim());
        request.input('specialization', sql.VarChar(100), specialization || null);
        request.input('phone', sql.VarChar(20), phone || null);
        request.input('email', sql.VarChar(100), email || null);
        request.input('experience_years', sql.Int, experience_years === '' ? null : experience_years);

        await request.query(`
            UPDATE trainers
            SET name = @name,
                specialization = @specialization,
                phone = @phone,
                email = @email,
                experience_years = @experience_years
            WHERE trainer_id = @trainer_id
        `);

        const result = await request.query(
            'SELECT trainer_id, name, specialization, phone, email, experience_years FROM trainers WHERE trainer_id = @trainer_id'
        );

        if (result.recordset.length === 0) {
            throw new Error('Trainer not found');
        }

        return result.recordset[0];
    } catch (err) {
        console.error('Update failed:', err);
        throw err;
    }
}

async function deleteTrainer(trainerId) {
    try {
        const pool = getPool();
        const request = pool.request();
        request.input('trainer_id', sql.Int, trainerId);
        const result = await request.query('DELETE FROM trainers WHERE trainer_id = @trainer_id');

        if (result.rowsAffected[0] === 0) {
            throw new Error('Trainer not found');
        }

        return { success: true };
    } catch (err) {
        console.error('Delete failed:', err);
        throw err;
    }
}

module.exports = {
    getAllTrainers,
    createTrainer,
    updateTrainer,
    deleteTrainer
};
