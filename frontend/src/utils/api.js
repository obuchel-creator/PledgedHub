// Lightweight test stub for screens that import '../utils/api'
// Provides mockable helpers; production screens should use services/api.js
export async function fetchWithAuth() {
  return { success: false, error: 'fetchWithAuth not implemented' };
}

export async function postWithAuth() {
  return { success: false, error: 'postWithAuth not implemented' };
}

export async function putWithAuth() {
  return { success: false, error: 'putWithAuth not implemented' };
}

export async function deleteWithAuth() {
  return { success: false, error: 'deleteWithAuth not implemented' };
}

export default {
  fetchWithAuth,
  postWithAuth,
  putWithAuth,
  deleteWithAuth,
};
