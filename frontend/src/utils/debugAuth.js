import { getViteEnv } from './getViteEnv';
/**
 * Debug utility to check authentication state
 * Run this in browser console: import('./utils/debugAuth.js').then(m => m.checkAuth())
 */

export function checkAuth() {
  console.group('🔍 Authentication Debug');

  // Check localStorage
  console.log('📦 localStorage keys:', Object.keys(localStorage));
  console.log('🔑 authToken:', localStorage.getItem('authToken'));
  console.log('👤 user:', localStorage.getItem('user'));
  console.log('🔐 pledgedhub_token:', localStorage.getItem('pledgedhub_token'));

  // Parse and display user
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('👤 Parsed user:', user);
  } catch (e) {
    console.log('❌ Failed to parse user');
  }

  // Test API call
  const token = localStorage.getItem('authToken');
  if (token) {
    console.log('✅ Token exists, testing API call...');
    const API_URL = getViteEnv().API_URL || 'http://localhost:5001/api';
    fetch(`${API_URL}/analytics/overview`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        console.log('📊 API Response Status:', res.status, res.statusText);
        return res.json();
      })
      .then((data) => {
        console.log('📋 API Response Data:', data);
      })
      .catch((err) => {
        console.error('❌ API Error:', err);
      });
  } else {
    console.log('❌ No token found in localStorage');
  }

  console.groupEnd();
}

// Auto-run on import in development
if (getViteEnv().NODE_ENV === 'development') {
  console.log('💡 Run checkAuth() in console to debug authentication');
}

export default { checkAuth };

