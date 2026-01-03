// test-login.js
// Directly test the backend login endpoint using Node.js and axios

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/auth/login';

const testCredentials = {
  username: 'testuser', // Change to your registered username
  password: 'testpass123' // Change to your registered password
};

async function testLogin() {
  try {
    const response = await axios.post(BASE_URL, testCredentials);
    console.log('Login response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Login failed:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
