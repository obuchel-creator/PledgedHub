// =============================
// ADMIN PASSWORD RESET & 2FA API
// =============================

/**
 * Superadmin: Reset another admin's password
 * @param {number} adminId - Admin user ID
 * @param {string} newPassword - New password
 * @returns {Promise<Object>}
 */
export async function superadminResetAdminPassword(adminId, newPassword) {
  if (!adminId || !newPassword) {
    return Promise.reject(new Error('superadminResetAdminPassword: adminId and newPassword are required'));
  }
  const client = await getClient();
  return handleRequest(client.post(`users/${adminId}/reset-password`, { newPassword }));
}

// 2FA Management API

/**
 * Get 2FA status for a user (self or admin)
 * @param {number} [userId] - Optional user ID (admin only)
 * @returns {Promise<Object>}
 */
export async function getTwoFactorStatus(userId) {
  const client = await getClient();
  const path = userId ? `twofactor/status/${userId}` : 'twofactor/status';
  return handleRequest(client.get(path));
}

/**
 * Initiate/setup 2FA for a user (self or admin)
 * @param {number} [userId] - Optional user ID (admin only)
 * @returns {Promise<Object>} (returns QR code, secret, etc)
 */
export async function setupTwoFactor(userId) {
  const client = await getClient();
  const path = userId ? `twofactor/setup/${userId}` : 'twofactor/setup';
  return handleRequest(client.post(path));
}

/**
 * Enable 2FA for a user (self or admin)
 * @param {string} code - Verification code
 * @param {number} [userId] - Optional user ID (admin only)
 * @returns {Promise<Object>}
 */
export async function enableTwoFactor(code, userId) {
  const client = await getClient();
  const path = userId ? `twofactor/enable/${userId}` : 'twofactor/enable';
  return handleRequest(client.post(path, { code }));
}

/**
 * Disable 2FA for a user (self or admin)
 * @param {number} [userId] - Optional user ID (admin only)
 * @returns {Promise<Object>}
 */
export async function disableTwoFactor(userId) {
  const client = await getClient();
  const path = userId ? `twofactor/disable/${userId}` : 'twofactor/disable';
  return handleRequest(client.post(path));
}

/**
 * Verify 2FA code (self or admin)
 * @param {string} code - Verification code
 * @param {number} [userId] - Optional user ID (admin only)
 * @returns {Promise<Object>}
 */
export async function verifyTwoFactor(code, userId) {
  const client = await getClient();
  const path = userId ? `twofactor/verify/${userId}` : 'twofactor/verify';
  return handleRequest(client.post(path, { code }));
}

import { getViteEnv } from '../utils/getViteEnv';
const viteEnv = getViteEnv();
// Force using proxy - always use /api to go through Vite dev server proxy
const BASE_URL = '/api';
const DEBUG_AUTH = String(viteEnv.DEBUG_AUTH || '').toLowerCase() === 'true';
const DEBUG_API = String(viteEnv.DEBUG_API || '').toLowerCase() === 'true' || DEBUG_AUTH;

function apiDebug(...args) {
  if (DEBUG_API) {
    console.log(...args);
  }
}

function apiDebugError(...args) {
  if (DEBUG_API) {
    console.error(...args);
  }
}

apiDebug('[API] api.js loaded - version 2025-12-16');

const AUTH_TOKEN_KEYS = ['pledgedhub_token', 'pledgehub_token', 'authToken', 'token'];

export function getStoredAuthToken() {
  for (const key of AUTH_TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value && value !== 'null' && value !== 'undefined') {
      return value;
    }
  }
  return null;
}

apiDebug('API Configuration:', {
  API_URL: viteEnv.API_URL,
  APP_NAME: viteEnv.APP_NAME,
  APP_VERSION: viteEnv.APP_VERSION,
  NODE_ENV: viteEnv.NODE_ENV,
  BASE_URL: BASE_URL,
});

function withLeadingSlash(path) {
  const value = String(path || '');
  if (!value) return '/';
  return value.startsWith('/') ? value : `/${value.replace(/^\/+/, '')}`;
}

function buildUrl(path, params) {
  const p = path ? String(path).replace(/^\/+/, '') : '';
  const urlBase = BASE_URL ? `${BASE_URL}/${p}` : `/${p}`;
  if (!params || Object.keys(params).length === 0) {
    apiDebug('Requesting URL:', urlBase);
    return urlBase;
  }
  const qs = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      if (v === undefined || v === null) return acc;
      if (Array.isArray(v)) v.forEach((item) => acc.push([k, String(item)]));
      else acc.push([k, String(v)]);
      return acc;
    }, []),
  ).toString();
  const fullUrl = urlBase + (urlBase.includes('?') ? '&' : '?') + qs;
  apiDebug('Requesting URL:', fullUrl);
  return fullUrl;
}

let clientPromise;

async function createHttpClient() {
  // Use fetch API directly - no axios dependency
  const client = {
    async get(path, config = {}) {
      const url = buildUrl(path, config.params);
      const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
      
      // Add auth token if available
      const token = getStoredAuthToken();
      apiDebug('[API] GET Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      apiDebug('🌐 [API] GET Request:', url, { headers });
      try {
        const res = await fetch(url, { method: 'GET', headers });
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }
        if (!res.ok) {
          const msg = data?.error || data?.message || res.statusText;
          throw new Error(`${res.status}: ${msg || 'Error'}`);
        }
        apiDebug('✅ [API] GET Response:', data);
        return { data };
      } catch (err) {
        console.error('❌ [API] GET Error:', err);
        throw err;
      }
    },

    async post(path, body, config = {}) {
      const url = buildUrl(path, config.params);
      const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
      
      // Add auth token if available
      const token = getStoredAuthToken();
      apiDebug('[API] POST Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      apiDebug('🌐 [API] POST Request starting:', url);
      apiDebug('🌐 [API] POST body:', body);
      apiDebug('🌐 [API] POST headers:', headers);
      
      try {
        apiDebug('🌐 [API] Calling fetch...');
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: body ? JSON.stringify(body) : undefined
        });
        apiDebug('🌐 [API] Fetch returned, status:', res.status);
        
        const text = await res.text();
        apiDebug('🌐 [API] Response text:', text);
        
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }
        
        apiDebug('🌐 [API] Parsed data:', data);
        
        if (!res.ok) {
          const msg = data?.error || data?.message || res.statusText;
          console.error('❌ [API] POST Error Response:', { status: res.status, msg, data });
          throw new Error(`${res.status}: ${msg || 'Error'}`);
        }
        apiDebug('✅ [API] POST Response:', data);
        return { data };
      } catch (err) {
        console.error('❌ [API] POST Error:', err);
        throw err;
      }
    },

    async put(path, body, config = {}) {
      const url = buildUrl(path, config.params);
      const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
      
      const token = getStoredAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      apiDebug('🌐 [API] PUT Request:', url);
      try {
        const res = await fetch(url, {
          method: 'PUT',
          headers,
          body: body ? JSON.stringify(body) : undefined
        });
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }
        if (!res.ok) {
          const msg = data?.error || data?.message || res.statusText;
          throw new Error(`${res.status}: ${msg || 'Error'}`);
        }
        apiDebug('✅ [API] PUT Response:', data);
        return { data };
      } catch (err) {
        console.error('❌ [API] PUT Error:', err);
        throw err;
      }
    },

    async delete(path, config = {}) {
      const url = buildUrl(path, config.params);
      const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };
      
      const token = getStoredAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      apiDebug('🌐 [API] DELETE Request:', url);
      try {
        const res = await fetch(url, { method: 'DELETE', headers });
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }
        if (!res.ok) {
          const msg = data?.error || data?.message || res.statusText;
          throw new Error(`${res.status}: ${msg || 'Error'}`);
        }
        apiDebug('✅ [API] DELETE Response:', data);
        return { data };
      } catch (err) {
        console.error('❌ [API] DELETE Error:', err);
        throw err;
      }
    }
  };
  
  return client;
}

async function getClient() {
  try {
    if (!clientPromise) {
      apiDebug('[API] getClient: Creating new HTTP client');
      clientPromise = createHttpClient();
    } else {
      apiDebug('[API] getClient: Returning cached HTTP client');
    }
    return clientPromise;
  } catch (err) {
    console.error('[API] getClient error:', err);
    throw err;
  }
}

function handleRequest(promise) {
  apiDebug('[API] handleRequest: called');
  return promise
    .then((res) => {
      apiDebug('[API] handleRequest: response', res);
      return res && res.data !== undefined ? res.data : res;
    })
    .catch((err) => {
      console.error('[API] handleRequest: error', err);
      // axios error shape
      if (err && err.response) {
        const status = err.response.status;
        // Check for both 'error' and 'message' fields in response data
        const serverMsg =
          err.response.data && (err.response.data.error || err.response.data.message)
            ? (err.response.data.error || err.response.data.message)
            : err.response.statusText || JSON.stringify(err.response.data);
        
        // Return a structured error object instead of throwing
        return { 
          success: false, 
          error: serverMsg,
          status: status
        };
      }
      // fetch fallback
      if (err && err.message) {
        return { success: false, error: err.message };
      }
      return { success: false, error: 'An unknown error occurred' };
    });
}

export async function getPledges() {
  const client = await getClient();
  apiDebug('BASE_URL:', BASE_URL);
  apiDebug('Calling getPledges...');
  return handleRequest(client.get('pledges'));
}

export async function getCampaignPledges(campaignId) {
  if (campaignId == null) return Promise.reject(new Error('getCampaignPledges: campaignId is required'));
  const client = await getClient();
  return handleRequest(client.get('pledges', { params: { campaign_id: campaignId } }));
}

export async function getPledge(id) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('getPledge: id is required'));
  const client = await getClient();
  apiDebug('[API] getPledge: Requesting pledge with id:', id);
  try {
    // Try with token (if available)
    const result = await handleRequest(client.get(`pledges/${encodeURIComponent(String(id))}`));
    apiDebug('[API] getPledge: Got result:', result);
    // If result is { success: true, data: pledge }, return just the pledge
    if (result && result.success === true && result.data) {
      apiDebug('[API] getPledge: Unwrapping data:', result.data);
      return result.data;
    }
    // If API returned a structured error, bubble it up so callers can show a proper message
    if (result && result.success === false) {
      const message = result.error || 'Pledge not found';
      throw new Error(message);
    }
    return result;
  } catch (err) {
    console.error('[API] getPledge: Error with token, trying public endpoint:', err);
    // If unauthorized, try public share endpoint
    const url = buildUrl(`pledges/public/${encodeURIComponent(String(id))}`);
    return fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      .then(async res => {
        if (!res.ok) throw new Error('Pledge not found');
        const data = await res.json();
        apiDebug('[API] getPledge: Public endpoint returned:', data);
        // Return just the pledge data
        if (data && data.data) return data.data;
        if (data && data.success === false) throw new Error(data.error || 'Pledge not found');
        return data;
      })
      .catch(err => {
        console.error('[API] getPledge: Public endpoint failed:', err);
        throw new Error('Pledge not found');
      });
  }
}

/**
 * Verify a pledge with a token
 * @param {string} token - Verification token
 * @returns {Promise<Object>}
 */
export async function verifyPledge(token) {
  if (!token) return Promise.reject(new Error('verifyPledge: token is required'));
  const client = await getClient();
  return handleRequest(client.post(`pledges/verify/${encodeURIComponent(String(token))}`));
}

export async function createPledge(data) {
  if (!data) return Promise.reject(new Error('createPledge: data is required'));
  const client = await getClient();  // Use authenticated client
  return handleRequest(client.post('pledges', data));
}

export async function createPayment(data) {
  if (!data) return Promise.reject(new Error('createPayment: data is required'));
  const client = await getClient();
  return handleRequest(client.post('payments', data));
}

export async function getPayments(query = {}) {
  const client = await getClient();
  
  // Support both getPayments(id) and getPayments({ pledgeId: id })
  let params = query;
  if (typeof query === 'string' || typeof query === 'number') {
    params = { pledgeId: query };
  }
  
  const response = await handleRequest(client.get('payments', { params }));
  
  // Handle both { payments: [...] } and { data: [...] } response formats
  if (response && typeof response === 'object') {
    if (Array.isArray(response.payments)) {
      return response.payments;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
  }
  
  return [];
}

export async function loginUser(credentials) {
  const client = await getClient();
  // Always send identifier for login (backend expects { identifier, password })
  const payload = {
    identifier: credentials.identifier || credentials.email || credentials.phone || '',
    password: credentials.password,
  };
  return handleRequest(client.post('auth/login', payload));
}

export async function registerUser(userData) {
  // Accepts { name, email, phone, password }
  try {
    const client = await getClient();
    if (!client || typeof client.post !== 'function') {
      return { success: false, error: 'HTTP client not available' };
    }
    // Only send required fields
    const payload = {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
    };
    
    apiDebug('🔵 [API] Registering user with payload:', payload);
    apiDebug('🔵 [API] Calling POST to /api/register...');
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
    );
    
    // Race: API call vs timeout
    const res = await Promise.race([
      client.post('register', payload, {
        headers: { 'Content-Type': 'application/json' },
      }),
      timeoutPromise
    ]);
    
    apiDebug('🔵 [API] Registration response received:', res);
    
    // Expect { token, user } or { data: { token, user } }
    if (res && res.data) {
      if (res.data.token) {
        apiDebug('✅ [API] Registration successful, token:', res.data.token.substring(0, 20) + '...');
        return { token: res.data.token, user: res.data.user };
      }
      // Handle nested response
      if (res.data.data && res.data.data.token) {
        apiDebug('✅ [API] Registration successful (nested), token:', res.data.data.token.substring(0, 20) + '...');
        return { token: res.data.data.token, user: res.data.data.user };
      }
    }
    
    console.error('❌ [API] No token in response:', res);
    return { success: false, error: 'Registration failed. Please try again.' };
  } catch (err) {
    console.error('❌ [API] Registration error:', err);
    console.error('❌ [API] Error type:', err.constructor.name);
    console.error('❌ [API] Error message:', err?.message);
    return { 
      success: false, 
      error: err?.response?.data?.error || err?.message || 'Registration failed - please check your connection.' 
    };
  }
}

export async function getCurrentUser() {
  const client = await getClient();
  return handleRequest(client.get('auth/me'));
}


/**
 * Request password reset (email or phone)
 * @param {string} email - Email address (optional)
 * @param {string} phone - Phone number (optional)
 * @returns {Promise<Object>}
 */
export async function forgotPassword(email, phone, code, password) {
  const client = await getClient();
  const payload = {};
  if (email) payload.email = email;
  if (phone) payload.phone = phone;
  if (code) payload.code = code;
  if (password) payload.password = password;
  return handleRequest(client.post('auth/forgot-password', payload));
}

export async function resetPassword(token, password) {
  const client = await getClient();
  return handleRequest(client.post('auth/reset-password', { token, password }));
}

export async function deletePledge(id) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('deletePledge: id is required'));
  const client = await getClient();

  // Add delete method to fetch client
  const url = buildUrl(`pledges/${encodeURIComponent(String(id))}`);
  const headers = { 'Content-Type': 'application/json' };

  // Get JWT token from localStorage
  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg = data && typeof data === 'object' && data.message ? data.message : res.statusText;
      throw new Error(`Request failed: ${res.status} ${msg || 'Error'}`);
    }

    return data;
  } catch (err) {
    console.error('Delete error:', err);
    throw err;
  }
}

export async function updatePledge(id, data) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('updatePledge: id is required'));
  if (!data) return Promise.reject(new Error('updatePledge: data is required'));

  const url = buildUrl(`pledges/${encodeURIComponent(String(id))}`);
  const headers = { 'Content-Type': 'application/json' };

  // Get JWT token from localStorage
  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    const text = await res.text();
    let responseData;
    try {
      responseData = text ? JSON.parse(text) : null;
    } catch {
      responseData = text;
    }

    if (!res.ok) {
      const msg =
        responseData && typeof responseData === 'object' && responseData.message
          ? responseData.message
          : res.statusText;
      throw new Error(`Request failed: ${res.status} ${msg || 'Error'}`);
    }

    return responseData;
  } catch (err) {
    console.error('Update error:', err);
    throw err;
  }
}

// Notification functions
export async function sendPledgeReminder(pledgeId) {
  if (pledgeId === undefined || pledgeId === null)
    return Promise.reject(new Error('sendPledgeReminder: pledgeId is required'));

  const url = buildUrl(`notifications/reminder/${encodeURIComponent(String(pledgeId))}`);
  const headers = { 'Content-Type': 'application/json' };

  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg = data && typeof data === 'object' && data.message ? data.message : res.statusText;
      throw new Error(`Request failed: ${res.status} ${msg || 'Error'}`);
    }

    return data;
  } catch (err) {
    console.error('Send reminder error:', err);
    throw err;
  }
}

export async function sendBulkReminders() {
  const url = buildUrl('notifications/remind-all');
  const headers = { 'Content-Type': 'application/json' };

  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg = data && typeof data === 'object' && data.message ? data.message : res.statusText;
      throw new Error(`Request failed: ${res.status} ${msg || 'Error'}`);
    }

    return data;
  } catch (err) {
    console.error('Send bulk reminders error:', err);
    throw err;
  }
}

export async function sendCustomNotification(pledgeId, message) {
  if (pledgeId === undefined || pledgeId === null)
    return Promise.reject(new Error('sendCustomNotification: pledgeId is required'));
  if (!message) return Promise.reject(new Error('sendCustomNotification: message is required'));

  const url = buildUrl(`notifications/custom/${encodeURIComponent(String(pledgeId))}`);
  const headers = { 'Content-Type': 'application/json' };

  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg = data && typeof data === 'object' && data.message ? data.message : res.statusText;
      throw new Error(`Request failed: ${res.status} ${msg || 'Error'}`);
    }

    return data;
  } catch (err) {
    console.error('Send custom notification error:', err);
    throw err;
  }
}

export async function sendThankYou(pledgeId) {
  if (pledgeId === undefined || pledgeId === null)
    return Promise.reject(new Error('sendThankYou: pledgeId is required'));

  const url = buildUrl(`notifications/thank-you/${encodeURIComponent(String(pledgeId))}`);
  const headers = { 'Content-Type': 'application/json' };

  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg = data && typeof data === 'object' && data.message ? data.message : res.statusText;
      throw new Error(`Request failed: ${res.status} ${msg || 'Error'}`);
    }

    return data;
  } catch (err) {
    console.error('Send thank you error:', err);
    throw err;
  }
}

// ============================================
// AI & Analytics Functions
// ============================================

// Analytics API
export async function getAnalyticsOverview() {
  const client = await getClient();
  return handleRequest(client.get('analytics/overview'));
}

export async function getTopDonors(limit = 10) {
  const client = await getClient();
  return handleRequest(client.get('analytics/top-donors', { params: { limit } }));
}

export async function getAtRiskPledges() {
  const client = await getClient();
  return handleRequest(client.get('analytics/at-risk'));
}

export async function getCollectionTrends(period = '30d') {
  const client = await getClient();
  return handleRequest(client.get('analytics/trends', { params: { period } }));
}

export async function getPledgesByStatus() {
  const client = await getClient();
  return handleRequest(client.get('analytics/by-status'));
}

// AI API
export async function getAIStatus() {
  const client = await getClient();
  return handleRequest(client.get('ai/status'));
}

export async function generateAIMessage(data) {
  const client = await getClient();
  return handleRequest(client.post('ai/generate-message', data));
}

export async function getAIInsights() {
  const client = await getClient();
  return handleRequest(client.get('ai/insights'));
}

export async function getAISuggestions() {
  const client = await getClient();
  return handleRequest(client.get('ai/suggestions'));
}

export async function analyzeAIPledgeData() {
  const client = await getClient();
  return handleRequest(client.post('ai/analyze'));
}

export async function chatWithAI(message, context) {
  if (!message || typeof message !== 'string')
    return Promise.reject(new Error('chatWithAI: message is required'));
  const client = await getClient();
  return handleRequest(client.post('ai/chat', { message, context }));
}

export async function generateAIThankYou(pledgeId) {
  if (pledgeId === undefined || pledgeId === null)
    return Promise.reject(new Error('generateAIThankYou: pledgeId is required'));
  const client = await getClient();
  return handleRequest(client.post(`ai/thank-you/${encodeURIComponent(String(pledgeId))}`));
}

// Message Generation API
export async function getMessageTemplates() {
  const client = await getClient();
  return handleRequest(client.get('messages/templates'));
}

export async function generateReminderMessage(data) {
  const client = await getClient();
  return handleRequest(client.post('messages/reminder', data));
}

export async function generateThankYouMessage(pledgeId) {
  if (pledgeId === undefined || pledgeId === null)
    return Promise.reject(new Error('generateThankYouMessage: pledgeId is required'));
  const client = await getClient();
  return handleRequest(client.post(`messages/thank-you/${encodeURIComponent(String(pledgeId))}`));
}

export async function generateFollowUpMessage(data) {
  const client = await getClient();
  return handleRequest(client.post('messages/follow-up', data));
}

export async function generateConfirmationMessage(pledgeId) {
  if (pledgeId === undefined || pledgeId === null)
    return Promise.reject(new Error('generateConfirmationMessage: pledgeId is required'));
  const client = await getClient();
  return handleRequest(
    client.post(`messages/confirmation/${encodeURIComponent(String(pledgeId))}`),
  );
}

export async function generateBulkMessages(data) {
  const client = await getClient();
  return handleRequest(client.post('messages/bulk', data));
}

// Reminder API
export async function getReminderStatus() {
  const client = await getClient();
  return handleRequest(client.get('reminders/status'));
}

export async function getUpcomingReminders() {
  const client = await getClient();
  return handleRequest(client.get('reminders/upcoming'));
}

export async function triggerManualReminders() {
  const client = await getClient();
  return handleRequest(client.post('reminders/trigger'));
}

// ============================================
// Campaign Functions
// ============================================

/**
 * Create a new fundraising campaign
 * @param {Object} data - Campaign data
 * @param {string} data.title - Campaign title
 * @param {string} data.description - Campaign description
 * @param {number} data.goalAmount - Total fundraising goal
 * @param {number} data.suggestedAmount - Suggested amount per donor
 * @returns {Promise<Object>}
 */
export async function createCampaign(data) {
  if (!data) return Promise.reject(new Error('createCampaign: data is required'));
  const client = await getClient();
  return handleRequest(client.post('campaigns', data));
}

/**
 * Get all campaigns
 * @param {string} status - Optional status filter (active/completed/cancelled)
 * @returns {Promise<Object>}
 */
export async function getCampaigns(status = null) {
  const client = await getClient();
  const params = status ? { status } : {};
  return handleRequest(client.get('campaigns', { params }));
}

/**
 * Get campaign details with pledges
 * @param {number} id - Campaign ID
 * @returns {Promise<Object>}
 */
export async function getCampaignDetails(id) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('getCampaignDetails: id is required'));
  const client = await getClient();
  return handleRequest(client.get(`campaigns/${encodeURIComponent(String(id))}`));
}

/**
 * Update campaign status
 * @param {number} id - Campaign ID
 * @param {string} status - New status (active/completed/cancelled)
 * @returns {Promise<Object>}
 */
export async function updateCampaignStatus(id, status) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('updateCampaignStatus: id is required'));
  if (!status) return Promise.reject(new Error('updateCampaignStatus: status is required'));
  const client = await getClient();
  return handleRequest(
    client.put(`campaigns/${encodeURIComponent(String(id))}/status`, { status }),
  );
}

// ============================================
// USER MANAGEMENT API
// ============================================

/**
 * Get all users (admin only)
 * @param {Object} options - Query options
 * @param {boolean} options.includeDeleted - Include soft-deleted users
 * @param {string} options.search - Search term
 * @param {number} options.limit - Results limit
 * @param {number} options.offset - Results offset
 * @returns {Promise<Object>}
 */
export async function getUsers(options = {}) {
  const client = await getClient();
  const params = {};
  if (options.includeDeleted !== undefined) params.includeDeleted = options.includeDeleted;
  if (options.search) params.search = options.search;
  if (options.limit) params.limit = options.limit;
  if (options.offset) params.offset = options.offset;

  return handleRequest(client.get('users', { params }));
}

/**
 * Delete a user (admin only)
 * @param {number} id - User ID
 * @param {Object} options - Deletion options
 * @param {string} options.type - 'soft' or 'hard' (default: 'soft')
 * @param {boolean} options.cascade - Delete user's pledges too (for hard delete)
 * @returns {Promise<Object>}
 */
export async function deleteUser(id, options = {}) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('deleteUser: id is required'));
  const client = await getClient();

  const params = {};
  if (options.type) params.type = options.type;
  if (options.cascade !== undefined) params.cascade = options.cascade;

  return handleRequest(client.delete(`users/${encodeURIComponent(String(id))}`, { params }));
}

/**
 * Restore a soft-deleted user (admin only)
 * @param {number} id - User ID
 * @returns {Promise<Object>}
 */
export async function restoreUser(id) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('restoreUser: id is required'));
  const client = await getClient();
  return handleRequest(client.post(`users/${encodeURIComponent(String(id))}/restore`));
}

/**
 * Get user details
 * @param {number} id - User ID
 * @returns {Promise<Object>}
 */
export async function getUserDetails(id) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('getUserDetails: id is required'));
  const client = await getClient();
  return handleRequest(client.get(`users/${encodeURIComponent(String(id))}`));
}

/**
 * Change user password
 * @param {Object} data - Password change data
 * @param {string} data.currentPassword - Current password
 * @param {string} data.newPassword - New password
 * @returns {Promise<Object>}
 */
export async function changePassword(data) {
  if (!data || !data.currentPassword || !data.newPassword) {
    return Promise.reject(
      new Error('changePassword: currentPassword and newPassword are required'),
    );
  }
  const client = await getClient();
  return handleRequest(client.post('password/change', data));
}
