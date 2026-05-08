const { connectToDatabase, sql } = require('./db');

async function testFrontendMessage() {
  try {
    await connectToDatabase();
    console.log('Testing that frontend receives correct error message...\n');
    
    const { enrollMember } = require('./models/enrollmentModel');
    
    // Test with member who has only monthly plan
    console.log('=== Testing member with ONLY monthly plan ===');
    try {
      const result = await enrollMember(3, 7); // class 3, member 7 (Test Monthly User)
      console.log('❌ ERROR: Should have been blocked');
    } catch (err) {
      console.log('Error message received:', err.message);
      
      // Check if this matches the frontend detection logic
      const errorMessage = err.message.toLowerCase();
      const isUpgradeMessage = errorMessage.includes('upgrade your plan') || 
                               errorMessage.includes('monthly plan') ||
                               errorMessage.includes('membership plan does not include access');
      
      if (isUpgradeMessage) {
        console.log('✅ SUCCESS: Frontend will detect this as an upgrade message');
        console.log('Frontend will show: "Upgrade your membership to Quarterly or Yearly plan to enroll in group classes."');
      } else {
        console.log('❌ ISSUE: Frontend might not detect this correctly');
      }
    }
    
  } catch (err) {
    console.error('Test error:', err.message);
  }
  process.exit(0);
}

testFrontendMessage();
