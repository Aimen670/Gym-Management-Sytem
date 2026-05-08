const { connectToDatabase, sql } = require('./db');

async function checkMonthlyMembers() {
  try {
    await connectToDatabase();
    const pool = require('./db').getPool();
    
    console.log('Checking all members with active monthly plans...');
    
    // Check all members with active subscriptions
    const membersWithPlans = await pool.request()
      .query(`
        SELECT 
          m.member_id,
          m.full_name,
          m.email,
          ms.plan_id,
          mp.plan_name,
          mp.duration_months,
          ms.start_date,
          ms.end_date,
          CASE WHEN CAST(GETDATE() AS DATE) > ms.end_date THEN 'expired' ELSE 'active' END AS subscription_status
        FROM members m
        JOIN member_subscriptions ms ON m.member_id = ms.member_id
        JOIN membership_plans mp ON ms.plan_id = mp.plan_id
        ORDER BY m.member_id, ms.end_date DESC
      `);

    console.log('All Members with Subscriptions:');
    membersWithPlans.recordset.forEach(member => {
      console.log(`- ${member.full_name} (ID: ${member.member_id}): ${member.plan_name} - ${member.subscription_status}`);
    });
    
    // Find members with active monthly plans
    const monthlyMembers = membersWithPlans.recordset.filter(m => 
      m.plan_name === 'Monthly Plan' && m.subscription_status === 'active'
    );
    
    console.log('\nMembers with ACTIVE Monthly Plans:');
    monthlyMembers.forEach(member => {
      console.log(`- ${member.full_name} (ID: ${member.member_id}): ${member.plan_name} - Active until ${member.end_date.toISOString().split('T')[0]}`);
    });
    
    if (monthlyMembers.length === 0) {
      console.log('\n❌ No members with active monthly plans found!');
      
      // Check if there are any monthly plans at all
      const anyMonthlyPlans = membersWithPlans.recordset.filter(m => m.plan_name === 'Monthly Plan');
      if (anyMonthlyPlans.length > 0) {
        console.log('Found expired monthly plans:');
        anyMonthlyPlans.forEach(member => {
          console.log(`- ${member.full_name} (ID: ${member.member_id}): ${member.plan_name} - ${member.subscription_status} (expired: ${member.end_date.toISOString().split('T')[0]})`);
        });
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkMonthlyMembers();
