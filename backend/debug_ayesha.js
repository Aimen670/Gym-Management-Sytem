const { connectToDatabase, sql } = require('./db');

async function debugAyesha() {
  try {
    await connectToDatabase();
    const pool = require('./db').getPool();
    
    console.log('Debugging Ayesha Malik (ID: 4) enrollment issue...');
    
    const memberId = 4;
    
    // Check ALL subscriptions for Ayesha
    const allSubscriptions = await pool.request()
      .input('member_id', sql.Int, memberId)
      .query(`
        SELECT
          ms.subscription_id,
          ms.plan_id,
          mp.plan_name,
          mp.duration_months,
          ms.start_date,
          ms.end_date,
          CASE WHEN CAST(GETDATE() AS DATE) > ms.end_date THEN 'expired' ELSE 'active' END AS subscription_status
        FROM member_subscriptions ms
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id
        WHERE ms.member_id = @member_id
        ORDER BY ms.end_date DESC
      `);

    console.log('\nAll Ayesha\'s subscriptions:');
    allSubscriptions.recordset.forEach(sub => {
      console.log(`- Plan: ${sub.plan_name} (${sub.plan_id}) - ${sub.subscription_status} - ${sub.start_date.toISOString().split('T')[0]} to ${sub.end_date.toISOString().split('T')[0]}`);
    });
    
    // Check what the current enrollment logic returns
    console.log('\nCurrent enrollment logic result:');
    const currentLogic = await pool.request()
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

    console.log('Current logic result:', currentLogic.recordset[0]);
    
    // Check if she has ANY monthly plan that's active
    console.log('\nChecking for ANY active monthly plan:');
    const monthlyCheck = await pool.request()
      .input('member_id', sql.Int, memberId)
      .query(`
        SELECT TOP 1
          ms.plan_id,
          mp.plan_name,
          mp.duration_months,
          ms.start_date,
          ms.end_date
        FROM member_subscriptions ms
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id
        WHERE ms.member_id = @member_id
          AND ms.end_date >= CAST(GETDATE() AS DATE)
          AND mp.plan_name = 'Monthly Plan'
        ORDER BY ms.start_date DESC
      `);

    console.log('Monthly plan check result:', monthlyCheck.recordset[0]);
    
    // Test enrollment with a specific class
    const classId = 3; // Morning Yoga Flow
    console.log(`\nTesting enrollment for class ${classId}...`);
    
    // Check class plans
    const classPlans = await pool.request()
      .input('class_id', sql.Int, classId)
      .query('SELECT plan_id FROM class_plans WHERE class_id = @class_id');

    console.log('Class allowed plans:', classPlans.recordset.map(r => r.plan_id));
    
    // Current logic test
    const allowedPlanIds = classPlans.recordset.map(row => row.plan_id);
    const memberPlan = currentLogic.recordset[0];
    
    console.log('Current logic - Member Plan ID:', memberPlan?.plan_id);
    console.log('Current logic - Should be blocked:', allowedPlanIds.length > 0 && !allowedPlanIds.includes(memberPlan?.plan_id));
    
    // Proposed new logic - check if member has ANY monthly plan
    const hasMonthlyPlan = monthlyCheck.recordset.length > 0;
    console.log('New logic - Has monthly plan:', hasMonthlyPlan);
    console.log('New logic - Should be blocked:', hasMonthlyPlan);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

debugAyesha();
