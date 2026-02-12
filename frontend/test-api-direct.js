/**
 * Direct test of payments API endpoint
 * Run this in the browser console while logged in to dashboard
 */

async function testPaymentsAPI() {
  console.log('🧪 Testing Payments API...');
  
  const token = localStorage.getItem('pledgehub_token');
  console.log('📝 Token found:', token ? `${token.substring(0, 10)}...` : 'NONE');
  
  if (!token) {
    console.error('❌ No token found. Please login first.');
    return;
  }
  
  try {
    const url = '/api/payments';
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Response status:', response.status);
    console.log('✓ Response headers:', {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length')
    });
    
    const text = await response.text();
    console.log('📄 Raw response text length:', text.length);
    console.log('📄 Raw response first 200 chars:', text.substring(0, 200));
    
    if (!response.ok) {
      console.error('❌ Response not OK');
      console.error('Error body:', text);
      return;
    }
    
    const data = JSON.parse(text);
    console.log('✓ Parsed response:', data);
    console.log('✓ Response shape:', {
      hasSuccess: 'success' in data,
      hasData: 'data' in data,
      hasPayments: 'payments' in data,
      successValue: data.success,
      dataIsArray: Array.isArray(data.data),
      paymentsIsArray: Array.isArray(data.payments),
      paymentsCount: data.payments ? data.payments.length : 'N/A',
      dataCount: data.data ? data.data.length : 'N/A'
    });
    
    if (Array.isArray(data.payments) && data.payments.length > 0) {
      console.log('✓ First payment:', data.payments[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run it
testPaymentsAPI();
