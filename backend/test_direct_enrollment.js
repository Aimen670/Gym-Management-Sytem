const { connectToDatabase, sql, getPool } = require('./db');
const { enrollMember } = require('./models/enrollmentModel');

async function testDirectEnrollment() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');
    
    const pool = getPool();
    console.log('Got pool successfully');
    
    // Find Ayesha's member ID
    const memberResult = await pool.request()
      .query("SELECT member_id, full_name, email FROM members WHERE full_name LIKE '%ayesha%' OR email LIKE '%ayesha%'");
    
    console.log('Member data:', memberResult.recordset);
    
    if (memberResult.recordset.length === 0) {
      console.log('Ayesha not found');
      return;
    }
    
    const ayesha = memberResult.recordset[0];
    console.log('Found Ayesha:', ayesha);
    
    // Get first available class
    const classResult = await pool.request()
      .query("SELECT TOP 1 class_id, class_name FROM classes");
    
    if (classResult.recordset.length === 0) {
      console.log('No classes found');
      return;
    }
    
    const firstClass = classResult.recordset[0];
    console.log('Testing with class:', firstClass);
    
    // Check Ayesha's current subscriptions
    const subscriptionResult = await pool.request()
      .input('member_id', sql.Int, ayesha.member_id)
      .query(`
        SELECT ms.*, mp.plan_name 
        FROM member_subscriptions ms 
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id 
        WHERE ms.member_id = @member_id 
        ORDER BY ms.end_date DESC
      `);
    
    console.log('Ayesha subscriptions:', subscriptionResult.recordset);
    
    // Test enrollment
    try {
      const result = await enrollMember(firstClass.class_id, ayesha.member_id);
      console.log('Enrollment successful:', result);
    } catch (error) {
      console.log('Enrollment failed with error:', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  process.exit(0);
}

testDirectEnrollment();
