const { sql, getPool } = require('./db');

async function checkClasses() {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT class_id, class_name, schedule_date, schedule_time FROM classes ORDER BY schedule_date');
    console.log('All classes:');
    console.log(result.recordset);
    
    const enrollResult = await pool.request().query('SELECT ce.member_id, ce.class_id, c.class_name, c.schedule_date FROM class_enrollments ce JOIN classes c ON ce.class_id = c.class_id ORDER BY ce.enrollment_id');
    console.log('\nAll enrollments:');
    console.log(enrollResult.recordset);
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkClasses();
