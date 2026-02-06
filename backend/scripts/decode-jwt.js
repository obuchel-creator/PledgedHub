const jwt = require('jsonwebtoken');
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

(async () => {
  // Register and login
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'debugtest.pledge@example.com',
    password: 'DebugTest123!@#'
  });

  const token = loginRes.data.token;

  // Decode token
  try {
    const decoded = jwt.decode(token);
    console.log('JWT Payload:');
    console.log(JSON.stringify(decoded, null, 2));
  } catch (err) {
    console.error('Error decoding JWT:', err.message);
  }
})();
