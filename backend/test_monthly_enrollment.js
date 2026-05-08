const { connectToDatabase, sql } = require('./db');

async function testMonthlyEnrollment() {
  try {
    await connectToDatabase();
    const pool = require('./db').getPool();
    
    console.log('Testing enrollment logic for monthly member (Ali Khan ID: 1)...');
    
    // Test with Ali Khan who has active monthly plans
    const memberId = 1;
    const classId = 3; // Morning Yoga Flow
    
    // Check member's current subscription (same query as in enrollmentModel.js)
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

    console.log('Member Plan (TOP 1):', memberPlanCheck.recordset[0]);
    
    // Check all active subscriptions for this member
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

    console.log('All Active Plans for Member:', allActivePlans.recordset);
    
    // Check class plans
    const classPlans = await pool.request()
      .input('class_id', sql.Int, classId)
      .query('SELECT plan_id FROM class_plans WHERE class_id = @class_id');

    console.log('Class Allowed Plans:', classPlans.recordset);
    
    const allowedPlanIds = classPlans.recordset.map(row => row.plan_id);
    const memberPlan = memberPlanCheck.recordset[0];
    
    console.log('Allowed Plan IDs:', allowedPlanIds);
    console.log('Member Plan ID:', memberPlan?.plan_id);
    console.log('Should be blocked:', allowedPlanIds.length > 0 && !allowedPlanIds.includes(memberPlan?.plan_id));
    
    if (allowedPlanIds.length > 0 && !allowedPlanIds.includes(memberPlan?.plan_id)) {
      if (memberPlan.plan_name === 'Monthly Plan') {
        console.log('❌ BLOCKED: Upgrade your plan to Quarterly or Yearly plan to enroll in group classes.');
      } else {
        console.log('❌ BLOCKED: Your current membership plan does not include access to this class. Please upgrade your plan.');
      }
    } else {
      console.log('✅ ALLOWED: Member can enroll in this class');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

testMonthlyEnrollment();
