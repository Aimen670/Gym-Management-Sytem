const { connectToDatabase } = require('./db');

async function testEnrollment() {
    try {
        await connectToDatabase();
        console.log('Connected to database');

        const { sql, getPool } = require('./db');
        const pool = getPool();

        // Test enrollment: Enroll member 1 (Ali Khan) in class 11 (Morning Yoga Flow)
        const memberId = 1;
        const classId = 11;

        console.log(`Testing enrollment: Member ${memberId} enrolling in Class ${classId}`);

        try {
            // First check if enrollment exists
            const checkResult = await pool.request()
                .input('class_id', sql.Int, classId)
                .input('member_id', sql.Int, memberId)
                .query('SELECT enrollment_id FROM class_enrollments WHERE class_id = @class_id AND member_id = @member_id');

            let enrollmentId;
            if (checkResult.recordset.length === 0) {
                // Create new enrollment
                const insertResult = await pool.request()
                    .input('class_id', sql.Int, classId)
                    .input('member_id', sql.Int, memberId)
                    .query(`
                        INSERT INTO class_enrollments (class_id, member_id) VALUES (@class_id, @member_id)
                        SELECT SCOPE_IDENTITY() as enrollment_id;
                    `);
                enrollmentId = insertResult.recordset[0].enrollment_id;
                console.log(`✓ Created new enrollment for member ${memberId} in class ${classId}`);
            } else {
                enrollmentId = checkResult.recordset[0].enrollment_id;
                console.log(`✓ Member ${memberId} already enrolled in class ${classId} (Enrollment ID: ${enrollmentId})`);
            }
            
            console.log(`✓ Member ${memberId} enrolled in class ${classId} (Enrollment ID: ${enrollmentId})`);

            // Test the dashboard API to see if the class appears
            console.log('\nTesting dashboard API for member 1...');
            const dashboardResult = await pool.request()
                .input('member_id', sql.Int, memberId)
                .query(`
                    SELECT
                        c.class_id,
                        c.class_name,
                        c.schedule_date,
                        c.schedule_time,
                        t.name AS trainer_name,
                        ce.enrollment_id
                    FROM class_enrollments ce
                    JOIN classes c ON ce.class_id = c.class_id
                    LEFT JOIN trainers t ON c.trainer_id = t.trainer_id
                    WHERE ce.member_id = @member_id
                      AND c.schedule_date >= CAST(GETDATE() AS DATE)
                    ORDER BY c.schedule_date, c.schedule_time
                `);

            console.log('Upcoming classes for member 1:');
            console.log(dashboardResult.recordset);

        } catch (error) {
            console.log(`✗ Enrollment failed: ${error.message}`);
        }

        console.log('\n✅ Test completed!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

testEnrollment();
