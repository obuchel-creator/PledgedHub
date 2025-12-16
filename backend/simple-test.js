// Simple API test
const http = require('http');

async function testAPI() {
  console.log('🧪 Testing API endpoints...');
  
  // Test basic endpoint
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:5001/api/test', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        });
      });
      
      req.on('error', reject);
      req.setTimeout(5000);
    });
    
    console.log('✅ API Test Response:', response);
    
    if (response.status === 200) {
      console.log('🎉 API is working correctly!');
      process.exit(0);
    } else {
      console.log('❌ API returned error status:', response.status);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('💡 Make sure the server is running on port 5001');
    process.exit(1);
  }
}

testAPI();