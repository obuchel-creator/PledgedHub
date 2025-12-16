
console.log('[API] api.js loaded - version 2025-12-16');
import { getViteEnv } from '../utils/getViteEnv';
const viteEnv = getViteEnv();
// Force using proxy - always use /api to go through Vite dev server proxy
const BASE_URL = '/api';

console.log('API Configuration:', {
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
    console.log('Requesting URL:', urlBase);
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
  console.log('Requesting URL:', fullUrl);
  return fullUrl;
}

let clientPromise;

async function createHttpClient() {
  try {
    const { default: axios } = await import('axios');
    const client = axios.create({
      baseURL: BASE_URL || undefined,
      headers: { 'Content-Type': 'application/json' },
    });

    // Add request interceptor to attach token to every request
    client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
          console.debug('🔑 [AXIOS] Token attached to request:', token.substring(0, 20) + '...');
        } else {
          console.debug('⚠️ [AXIOS] No token found in localStorage');
        }
        console.debug('🌐 [AXIOS] Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('❌ [AXIOS] Request error:', error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for better error handling
    client.interceptors.response.use(
      (response) => {
        console.log('✅ [AXIOS] Response:', response.status, response.config.url);
        return response;
      },
      (error) => {
        // Only redirect on auth errors if we're not already on login/register pages
        // AND skip if we just logged in (within last 5 seconds)
        const isAuthPage =
          window.location.pathname.includes('/login') ||
          window.location.pathname.includes('/register') ||
          error.config?.url?.includes('/auth/login');

        const lastLoginTime = parseInt(localStorage.getItem('lastLoginTime') || '0');
        const timeSinceLogin = Date.now() - lastLoginTime;
        const justLoggedIn = timeSinceLogin < 5000; // Within 5 seconds

        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          !isAuthPage &&
          !justLoggedIn
        ) {
          console.error(
            '❌ [AXIOS] Auth error:',
            error.response.status,
            '- Token expired or invalid',
          );
          // Clear invalid token
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('lastLoginTime');
          // Redirect to login
          console.warn('🔄 [AXIOS] Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        console.error('❌ [AXIOS] Response error:', error.message);
        return Promise.reject(error);
      },
    );

    return client;
  } catch (error) {
    return {
      async get(path, config = {}) {
        const url = buildUrl(path, config.params);
        const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };

        // Add auth token if available
        const token = localStorage.getItem('authToken');
        console.debug(
          '🔑 [API] Token from localStorage:',
          token ? `${token.substring(0, 20)}...` : 'NOT FOUND',
        );
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.debug('🌐 [API] GET Request:', url);
        console.debug('📋 [API] Headers:', headers);
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
            const msg =
              data && typeof data === 'object' && data.message ? data.message : res.statusText;
            throw new Error(`Request failed: ${res.status} ${msg || 'Error'}`);
          }
          console.log('Response:', data);
          return { data };
        } catch (err) {
          console.error('Fetch error:', err);
          throw err;
        }
      },

      async post(path, payload, config = {}) {
        const url = buildUrl(path);
        const headers = { 'Content-Type': 'application/json', ...(config.headers || {}) };

        // Add auth token if available
        const token = localStorage.getItem('authToken');
        console.debug(
          '🔑 [API] Token from localStorage:',
          token ? `${token.substring(0, 20)}...` : 'NOT FOUND',
        );
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.debug('🔵 [API] POST Request:', {
          url,
          headers: {
            ...headers,
            Authorization: headers.Authorization ? `Bearer ${token.substring(0, 20)}...` : 'none',
          },
          payload: JSON.stringify(payload, null, 2),
        });

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: payload === undefined ? null : JSON.stringify(payload),
        });

        const text = await res.text();
        console.debug('🔵 [API] Response status:', res.status);
        console.debug('🔵 [API] Response text:', text);

        let data;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }

        if (!res.ok) {
          console.error('❌ [API] Request failed:', {
            status: res.status,
            statusText: res.statusText,
            responseData: data,
            url,
          });

          let errorMessage = `Request failed: ${res.status}`;

          if (data && typeof data === 'object') {
            if (data.error) {
              errorMessage += ` - ${data.error}`;
              if (data.details) {
                errorMessage += ` (Details: ${JSON.stringify(data.details)})`;
              }
            } else if (data.message) {
              errorMessage += ` - ${data.message}`;
            }
          } else if (res.statusText) {
            errorMessage += ` - ${res.statusText}`;
          }

          throw new Error(errorMessage);
        }

        console.debug('✅ [API] Request successful:', data);
        return { data };
      },
    };
  }
}

async function getClient() {
  try {
    if (!clientPromise) {
      console.log('[API] getClient: Creating new HTTP client');
      clientPromise = createHttpClient();
    } else {
      console.log('[API] getClient: Returning cached HTTP client');
    }
    return clientPromise;
  } catch (err) {
    console.error('[API] getClient error:', err);
    throw err;
  }
}

function handleRequest(promise) {
  console.log('[API] handleRequest: called');
  return promise
    .then((res) => {
      console.log('[API] handleRequest: response', res);
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
  console.log('BASE_URL:', BASE_URL);
  console.log('Calling getPledges...');
  return handleRequest(client.get('pledges'));
}

export async function getPledge(id) {
  if (id === undefined || id === null)
    return Promise.reject(new Error('getPledge: id is required'));
  const client = await getClient();
  return handleRequest(client.get(`pledges/${encodeURIComponent(String(id))}`));
}

export async function createPledge(data) {
  if (!data) return Promise.reject(new Error('createPledge: data is required'));
  const client = await getClient();
  return handleRequest(client.post('pledges', data));
}

export async function createPayment(data) {
  if (!data) return Promise.reject(new Error('createPayment: data is required'));
  const client = await getClient();
  return handleRequest(client.post('payments', data));
}

export async function getPayments(query = {}) {
  const client = await getClient();
  return handleRequest(client.get('payments', { params: query }));
}

export async function loginUser(credentials) {
  const client = await getClient();
  // Use email for login (backend expects { email, password })
  const payload = {
    email: credentials.email || credentials.identifier || '',
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
    
    console.debug('🔵 [API] Registering user with payload:', payload);
    
    // Use 'register' (not '/api/register') because BASE_URL already includes '/api'
    const res = await client.post('register', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.debug('🔵 [API] Registration response:', res);
    
    // Expect { token, user } or { data: { token, user } }
    if (res && res.data) {
      if (res.data.token) {
        return { token: res.data.token, user: res.data.user };
      }
      // Handle nested response
      if (res.data.data && res.data.data.token) {
        return { token: res.data.data.token, user: res.data.data.user };
      }
    }
    
    return { success: false, error: 'Registration failed. Please try again.' };
  } catch (err) {
    console.error('❌ [API] Registration error:', err);
    return { 
      success: false, 
      error: err?.response?.data?.error || err?.message || 'Registration failed.' 
    };
  }
}

export async function getCurrentUser() {
  const client = await getClient();
  return handleRequest(client.get('auth/me'));
}

export async function forgotPassword(email) {
  const client = await getClient();
  return handleRequest(client.post('auth/forgot-password', { email }));
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
  const token = localStorage.getItem('authToken');
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
  const token = localStorage.getItem('authToken');
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

  const token = localStorage.getItem('authToken');
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

  const token = localStorage.getItem('authToken');
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

  const token = localStorage.getItem('authToken');
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

  const token = localStorage.getItem('authToken');
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
