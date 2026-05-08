const { connectToDatabase, sql, getPool } = require('./db');

async function checkClassPlans() {
  try {
    await connectToDatabase();
    const pool = getPool();
    
    console.log('Checking class_plans table...');
    const classPlansResult = await pool.request().query('SELECT * FROM class_plans');
    console.log('Class Plans:', classPlansResult.recordset);
    
    console.log('\nChecking classes table...');
    const classesResult = await pool.request().query('SELECT class_id, class_name FROM classes');
    console.log('Classes:', classesResult.recordset);
    
    console.log('\nChecking membership_plans table...');
    const plansResult = await pool.request().query('SELECT plan_id, plan_name FROM membership_plans');
    console.log('Membership Plans:', plansResult.recordset);
    
    // Check if class_plans is empty, if so, populate it
    if (classPlansResult.recordset.length === 0) {
      console.log('\nclass_plans table is empty. Populating with default restrictions...');
      
      // Add class plans: allow only quarterly (plan_id=2) and yearly (plan_id=3) plans for classes
      for (const classItem of classesResult.recordset) {
        await pool.request()
          .input('class_id', sql.Int, classItem.class_id)
          .input('plan_id', sql.Int, 2)
          .query('INSERT INTO class_plans (class_id, plan_id) VALUES (@class_id, @plan_id)');
          
        await pool.request()
          .input('class_id', sql.Int, classItem.class_id)
          .input('plan_id', sql.Int, 3)
          .query('INSERT INTO class_plans (class_id, plan_id) VALUES (@class_id, @plan_id)');
      }
      
      console.log('class_plans table populated successfully!');
      
      // Verify the population
      const updatedResult = await pool.request().query('SELECT * FROM class_plans');
      console.log('Updated Class Plans:', updatedResult.recordset);
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkClassPlans();
