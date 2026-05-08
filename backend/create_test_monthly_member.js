const { connectToDatabase, sql } = require('./db');

async function createTestMonthlyMember() {
  try {
    await connectToDatabase();
    const pool = require('./db').getPool();
    
    console.log('Creating a test member with ONLY monthly plan...');
    
    // Create a new test member
    const memberResult = await pool.request()
      .input('full_name', sql.VarChar(100), 'Test Monthly User')
      .input('age', sql.Int, 25)
      .input('gender', sql.VarChar(10), 'male')
      .input('phone', sql.VarChar(20), '03991234567')
      .input('email', sql.VarChar(100), 'test.monthly@email.com')
      .input('password', sql.VarChar(255), 'testpass123')
      .input('fitness_goal', sql.VarChar, 'General Fitness')
      .query(`
        INSERT INTO members (full_name, age, gender, phone, email, password, fitness_goal)
        VALUES (@full_name, @age, @gender, @phone, @email, @password, @fitness_goal);
        SELECT SCOPE_IDENTITY() as member_id;
      `);
    
    const newMemberId = memberResult.recordset[0].member_id;
    console.log(`Created new member with ID: ${newMemberId}`);
    
    // Subscribe them to monthly plan only
    const subscriptionResult = await pool.request()
      .input('member_id', sql.Int, newMemberId)
      .input('plan_id', sql.Int, 1) // Monthly Plan
      .input('start_date', sql.Date, new Date().toISOString().slice(0, 10))
      .query(`
        INSERT INTO member_subscriptions (member_id, plan_id, start_date, end_date)
        VALUES (@member_id, @plan_id, @start_date, DATEADD(month, 1, @start_date));
        SELECT SCOPE_IDENTITY() as subscription_id;
      `);
    
    console.log(`Subscribed member ${newMemberId} to Monthly Plan`);
    
    // Test enrollment for this member
    const testResult = await pool.request()
      .input('member_id', sql.Int, newMemberId)
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

    console.log('Test Member Plan:', testResult.recordset[0]);
    
    console.log('\nNow you can test enrollment with this member ID:', newMemberId);
    console.log('This member should be BLOCKED from enrolling in classes since they only have a monthly plan.');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

createTestMonthlyMember();
