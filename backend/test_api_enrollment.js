const { connectToDatabase, sql, getPool } = require('./db');

async function testAPIEnrollment() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();
    console.log('Database connected successfully');
    
    const pool = getPool();
    
    // Find Ayesha's member ID
    const memberResult = await pool.request()
      .query("SELECT member_id, full_name, email FROM members WHERE full_name LIKE '%ayesha%' OR email LIKE '%ayesha%'");
    
    console.log('Member data:', memberResult.recordset);
    
    if (memberResult.recordset.length === 0) {
      console.log('Ayesha not found');
      return;
    }
    
    const ayesha = memberResult.recordset[0];
    
    // Get first available class
    const classResult = await pool.request()
      .query("SELECT TOP 1 class_id, class_name FROM classes");
    
    if (classResult.recordset.length === 0) {
      console.log('No classes found');
      return;
    }
    
    const firstClass = classResult.recordset[0];
    console.log('Testing API enrollment for Ayesha (ID:', ayesha.member_id, ') in class (ID:', firstClass.class_id, ')');
    
    // Test the exact same query that the enrollment model uses
    const memberPlanCheck = await pool.request()
      .input('member_id', sql.Int, ayesha.member_id)
      .query(`
        SELECT TOP 1
          ms.plan_id,
          mp.plan_name,
          mp.duration_months,
          ms.end_date
        FROM member_subscriptions ms
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id
        WHERE ms.member_id = @member_id
          AND ms.end_date >= CAST(GETDATE() AS DATE)
        ORDER BY ms.end_date DESC
      `);

    console.log('Active subscription check result:', memberPlanCheck.recordset);
    console.log('Current date (GETDATE()):', new Date().toISOString().split('T')[0]);
    
    if (memberPlanCheck.recordset.length === 0) {
      console.log('✓ VALIDATION WORKING: No active subscription found');
    } else {
      console.log('✗ VALIDATION FAILED: Found active subscription:', memberPlanCheck.recordset[0]);
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  process.exit(0);
}

testAPIEnrollment();
