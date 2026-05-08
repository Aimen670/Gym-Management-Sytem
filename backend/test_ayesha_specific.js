const { connectToDatabase, sql } = require('./db');

async function testAyeshaSpecific() {
  try {
    await connectToDatabase();
    const pool = require('./db').getPool();
    
    console.log('Testing enrollment logic for Ayesha Malik (ID: 4)...');
    
    const memberId = 4; // Ayesha Malik
    const classId = 3; // Morning Yoga Flow
    
    // Check Ayesha's membership status
    const memberPlanCheck = await pool.request()
      .input('member_id', sql.Int, memberId)
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

    console.log('Ayesha Plan (TOP 1):', memberPlanCheck.recordset[0]);
    
    // Check all active subscriptions for Ayesha
    const allActivePlans = await pool.request()
      .input('member_id', sql.Int, memberId)
      .query(`
        SELECT
          ms.plan_id,
          mp.plan_name,
          mp.duration_months,
          ms.start_date,
          ms.end_date
        FROM member_subscriptions ms
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id
        WHERE ms.member_id = @member_id
          AND ms.end_date >= CAST(GETDATE() AS DATE)
        ORDER BY ms.end_date DESC
      `);

    console.log('All Active Plans for Ayesha:', allActivePlans.recordset);
    
    // Check if Ayesha has ANY active monthly plan
    const monthlyPlanCheck = await pool.request()
      .input('member_id', sql.Int, memberId)
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
          AND mp.plan_name = 'Monthly Plan'
        ORDER BY ms.start_date DESC
      `);

    const hasActiveMonthlyPlan = monthlyPlanCheck.recordset.length > 0;
    console.log('Has Active Monthly Plan:', hasActiveMonthlyPlan);
    if (hasActiveMonthlyPlan) {
      console.log('Monthly Plan Details:', monthlyPlanCheck.recordset[0]);
    }
    
    // Test the actual enrollment function
    console.log('\nTesting enrollment function...');
    try {
      const { enrollMember } = require('./models/enrollmentModel');
      const result = await enrollMember(classId, memberId);
      console.log('❌ ERROR: Enrollment succeeded when it should have failed! Result:', result);
    } catch (err) {
      console.log('✅ SUCCESS: Enrollment was blocked as expected');
      console.log('Error message:', err.message);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

testAyeshaSpecific();
