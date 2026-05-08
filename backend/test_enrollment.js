const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testEnrollment() {
  try {
    // First, let's find Ayesha's member ID
    const memberResponse = await fetch('http://localhost:5000/api/members');
    const members = await memberResponse.json();
    
    const ayesha = members.find(m => m.full_name.toLowerCase().includes('ayesha') || m.email.toLowerCase().includes('ayesha'));
    
    if (!ayesha) {
      console.log('Ayesha not found in members list');
      return;
    }
    
    console.log('Found Ayesha:', ayesha);
    
    // Get available classes
    const classesResponse = await fetch('http://localhost:5000/api/classes');
    const classes = await classesResponse.json();
    
    if (classes.length === 0) {
      console.log('No classes available');
      return;
    }
    
    const firstClass = classes[0];
    console.log('Testing enrollment for class:', firstClass);
    
    // Test enrollment
    const enrollResponse = await fetch(`http://localhost:5000/api/classes/${firstClass.class_id}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        member_id: ayesha.member_id
      })
    });
    
    const enrollResult = await enrollResponse.json();
    console.log('Enrollment response status:', enrollResponse.status);
    console.log('Enrollment response body:', enrollResult);
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  process.exit(0);
}

testEnrollment();
