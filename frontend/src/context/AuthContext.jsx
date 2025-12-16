import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/api';

const TOKEN_KEY = 'authToken';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(!!token);

  async function refreshUser() {
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      const data = await getCurrentUser();
      setUser(data && data.user ? data.user : data);
      return data;
    } catch (err) {
      // token likely invalid
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // on mount, try to load user if token exists
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(credentials = {}) {
    // credentials: { email, password } or { username, password }
    setLoading(true);
    try {
      const data = await loginUser(credentials);
      const newToken = data && (data.token || data.accessToken);
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        await refreshUser();
      } else if (data && data.user) {
        setUser(data.user);
      }
      return data;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload = {}) {
    setLoading(true);
    try {
      const data = await registerUser(payload);
      // optionally auto-login when register returns token
      const newToken = data && (data.token || data.accessToken);
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        await refreshUser();
      }
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    // optional: notify backend
    try {
      fetch('/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
