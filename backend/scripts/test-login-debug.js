const axios = require('axios');
const BASE_URL = 'http://localhost:5001/api';

(async () => {
  try {
    console.log('Attempting login with test credentials...');
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'namevalidation.test@example.com',
      password: 'ValidTest123!@#'
    });
    console.log('Login successful:', res.data);
  } catch (err) {
    console.log('Login failed');
    console.log('Error status:', err.response?.status);
    console.log('Error data:', err.response?.data);
  }
})();
