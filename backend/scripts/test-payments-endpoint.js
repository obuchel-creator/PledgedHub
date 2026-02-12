/**
 * Test the payments endpoint directly
 * This will show the exact error being returned
 */

require('dotenv').config({ path: '.env' });

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

async function testPaymentsEndpoint() {
  console.log('🧪 Testing Payments Endpoint...\n');
  
  // Create a valid JWT token for user 18 (super_admin)
  const token = jwt.sign(
    { id: 18, email: 'zigocut.tech@gmail.com', role: 'super_admin' },
    process.env.JWT_SECRET
  );
  
  console.log('📝 Token created:', token.substring(0, 30) + '...\n');
  
  try {
    console.log('📡 Calling GET http://localhost:5001/api/payments');
    console.log('🔐 With Authorization: Bearer ' + token.substring(0, 30) + '...\n');
    
    const response = await fetch('http://localhost:5001/api/payments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✓ Status:', response.status, response.statusText);
    console.log('✓ Headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length')
    });
    
    const text = await response.text();
    console.log('\n📄 Raw Response Body:');
    console.log(text);
    
    try {
      const data = JSON.parse(text);
      console.log('\n✓ Parsed JSON:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.error) {
        console.log('\n❌ API Error:', data.error);
      }
      if (data.details) {
        console.log('\n📋 Error Details:', data.details);
      }
    } catch (e) {
      console.log('\n⚠️  Could not parse JSON:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testPaymentsEndpoint();
