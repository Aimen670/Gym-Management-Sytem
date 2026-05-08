const { connectToDatabase, sql, getPool } = require('./db');

async function checkEnrollment() {
  try {
    await connectToDatabase();
    const pool = getPool();
    
    // Check if Ayesha is already enrolled in any classes
    const enrollmentCheck = await pool.request()
      .input('member_id', sql.Int, 4) // Ayesha's ID
      .query(`
        SELECT ce.*, c.class_name 
        FROM class_enrollments ce
        JOIN classes c ON ce.class_id = c.class_id
        WHERE ce.member_id = @member_id
      `);
    
    console.log('Ayesha current enrollments:', enrollmentCheck.recordset);
    
    // Check all enrollments for yoga class (class_id = 2)
    const yogaEnrollments = await pool.request()
      .input('class_id', sql.Int, 2)
      .query(`
        SELECT ce.*, m.full_name, m.email
        FROM class_enrollments ce
        JOIN members m ON ce.member_id = m.member_id
        WHERE ce.class_id = @class_id
      `);
    
    console.log('All yoga class enrollments:', yogaEnrollments.recordset);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

checkEnrollment();
