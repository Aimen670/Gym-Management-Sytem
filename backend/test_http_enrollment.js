const http = require('http');

function testHTTPEndpoint() {
  const postData = JSON.stringify({
    member_id: 4 // Ayesha's ID
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/classes/2/enroll', // Class ID 2 (yoga)
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('Parsed JSON:', jsonData);
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

testHTTPEndpoint();
