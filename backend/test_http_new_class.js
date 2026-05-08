const http = require('http');

function testNewClassHTTPEndpoint() {
  // Test with class_id: 3 (Morning Yoga Flow) - Ayesha is not enrolled in this
  const postData = JSON.stringify({
    member_id: 4 // Ayesha's ID
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/classes/3/enroll', // Class ID 3 (Morning Yoga Flow)
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', jsonData);
        
        if (jsonData.error && jsonData.error.includes('No active subscription')) {
          console.log('✅ SUCCESS: Membership validation working correctly!');
        } else {
          console.log('❌ ISSUE: Expected membership validation error');
        }
      } catch (e) {
        console.log('Response is not valid JSON');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

testNewClassHTTPEndpoint();
