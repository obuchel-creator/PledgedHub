/**
 * Direct backend test - calls the listPayments function directly
 */

require('dotenv').config({ path: 'backend/.env' });

const paymentController = require('./backend/controllers/paymentController');
const jwt = require('jsonwebtoken');

async function testDirectly() {
  console.log('🧪 Testing Payments Controller Directly...\n');
  
  // Mock request
  const req = {
    user: {
      id: 18,
      email: 'zigocut.tech@gmail.com',
      role: 'super_admin'
    },
    query: {}
  };
  
  // Mock response
  let responseData = null;
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      responseData = data;
      console.log('Response:', JSON.stringify(data, null, 2));
      return this;
    }
  };
  
  try {
    console.log('📍 Calling paymentController.listPayments()...\n');
    await paymentController.listPayments(req, res);
    console.log('\n✅ Success! Response status:', res.statusCode);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDirectly();
