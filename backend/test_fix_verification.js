const { connectToDatabase, sql } = require('./db');

async function testFixVerification() {
  try {
    await connectToDatabase();
    console.log('Testing fixed enrollment logic...\n');
    
    const { enrollMember } = require('./models/enrollmentModel');
    
    // Test 1: Ayesha (has both Quarterly and Monthly plans) - should be ALLOWED
    console.log('=== Test 1: Ayesha (ID: 4) - Has Quarterly + Monthly plans ===');
    try {
      const result = await enrollMember(3, 4); // class 3, member 4
      console.log('❌ UNEXPECTED: Ayesha was allowed to enroll (this might be correct if she has Quarterly plan)');
      console.log('Result:', result);
    } catch (err) {
      console.log('Error:', err.message);
      if (err.message.includes('already enrolled')) {
        console.log('✅ EXPECTED: Ayesha is already enrolled (this means she has access)');
      } else if (err.message.includes('Upgrade your plan')) {
        console.log('❌ UNEXPECTED: Ayesha was blocked (she has Quarterly plan, should be allowed)');
      } else {
        console.log('❓ OTHER ERROR:', err.message);
      }
    }
    
    console.log('\n=== Test 2: Create test member with ONLY Monthly plan ===');
    
    // Let's check if there are any members with ONLY monthly plans
    const pool = require('./db').getPool();
    const membersWithOnlyMonthly = await pool.request().query(`
      SELECT DISTINCT m.member_id, m.full_name
      FROM members m
      JOIN member_subscriptions ms ON m.member_id = ms.member_id
      JOIN membership_plans mp ON ms.plan_id = mp.plan_id
      WHERE ms.end_date >= CAST(GETDATE() AS DATE)
        AND mp.plan_name = 'Monthly Plan'
        AND m.member_id NOT IN (
          SELECT DISTINCT m2.member_id
          FROM members m2
          JOIN member_subscriptions ms2 ON m2.member_id = ms2.member_id
          JOIN membership_plans mp2 ON ms2.plan_id = mp2.plan_id
          WHERE ms2.end_date >= CAST(GETDATE() AS DATE)
            AND mp2.plan_name IN ('Quarterly Plan', 'Yearly Plan')
        )
    `);
    
    console.log('Members with ONLY monthly plans:', membersWithOnlyMonthly.recordset);
    
    if (membersWithOnlyMonthly.recordset.length > 0) {
      const testMember = membersWithOnlyMonthly.recordset[0];
      console.log(`\n=== Test 3: ${testMember.full_name} (ID: ${testMember.member_id}) - Only Monthly plan ===`);
      try {
        const result = await enrollMember(3, testMember.member_id);
        console.log('❌ ERROR: Member with only monthly plan was allowed to enroll');
        console.log('Result:', result);
      } catch (err) {
        console.log('Error:', err.message);
        if (err.message.includes('Upgrade your plan')) {
          console.log('✅ SUCCESS: Member with only monthly plan was correctly blocked');
        } else {
          console.log('❓ OTHER ERROR:', err.message);
        }
      }
    } else {
      console.log('No members found with only monthly plans to test');
    }
    
  } catch (err) {
    console.error('Test error:', err.message);
  }
  process.exit(0);
}

testFixVerification();
