const { connectToDatabase, sql } = require('./db');

async function testAliKhan() {
  try {
    await connectToDatabase();
    const pool = require('./db').getPool();
    
    console.log('Testing FIXED enrollment logic for Ali Khan (ID: 1)...');
    
    const memberId = 1;
    const classId = 3; // Morning Yoga Flow
    
    // Test the actual enrollment function with the fix
    console.log('Testing enrollment function...');
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

testAliKhan();
