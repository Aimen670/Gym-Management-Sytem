const { sql, getPool } = require('./db');

async function checkMemberData() {
  try {
    const pool = getPool();
    
    // Check Ayesha's member data
    const memberResult = await pool.request()
      .query("SELECT member_id, full_name, email FROM members WHERE full_name LIKE '%ayesha%' OR email LIKE '%ayesha%'");
    
    console.log('Member data:', memberResult.recordset);
    
    if (memberResult.recordset.length > 0) {
      const memberId = memberResult.recordset[0].member_id;
      
      // Check Ayesha's subscriptions
      const subscriptionResult = await pool.request()
        .input('member_id', sql.Int, memberId)
        .query(`
          SELECT ms.*, mp.plan_name 
          FROM member_subscriptions ms 
          JOIN membership_plans mp ON ms.plan_id = mp.plan_id 
          WHERE ms.member_id = @member_id 
          ORDER BY ms.end_date DESC
        `);
      
      console.log('Subscription data:', subscriptionResult.recordset);
      
      // Check current date vs subscription dates
      const currentDate = new Date();
      console.log('Current date:', currentDate.toISOString().split('T')[0]);
      
      subscriptionResult.recordset.forEach(sub => {
        const endDate = new Date(sub.end_date);
        const isExpired = endDate < currentDate;
        console.log(`Subscription: ${sub.plan_name}, End: ${sub.end_date}, Expired: ${isExpired}`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkMemberData();
