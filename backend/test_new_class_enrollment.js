const { connectToDatabase, sql, getPool } = require('./db');

async function testNewClassEnrollment() {
  try {
    await connectToDatabase();
    const pool = getPool();
    
    // Get a class that Ayesha is NOT already enrolled in
    const availableClasses = await pool.request()
      .query(`
        SELECT c.class_id, c.class_name 
        FROM classes c
        WHERE c.class_id NOT IN (
          SELECT ce.class_id 
          FROM class_enrollments ce 
          WHERE ce.member_id = 4
        )
      `);
    
    console.log('Classes Ayesha is not enrolled in:', availableClasses.recordset);
    
    if (availableClasses.recordset.length === 0) {
      console.log('No available classes for testing');
      return;
    }
    
    const testClass = availableClasses.recordset[0];
    console.log('Testing enrollment in new class:', testClass);
    
    // Test enrollment using the enrollment model directly
    const { enrollMember } = require('./models/enrollmentModel');
    
    try {
      const result = await enrollMember(testClass.class_id, 4); // Ayesha's ID
      console.log('❌ ENROLLMENT SUCCEEDED (this should not happen):', result);
    } catch (error) {
      console.log('✅ ENROLLMENT FAILED AS EXPECTED:', error.message);
      
      // Check if this is the membership error we expect
      if (error.message.includes('No active subscription')) {
        console.log('✅ CORRECT: Membership validation is working');
      } else {
        console.log('❌ WRONG: Got different error than expected');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  process.exit(0);
}

testNewClassEnrollment();
