import React, { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/api';

const TOKEN_KEY = 'pledgehub_token';

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

  console.log('🔐 AuthContext: Initialized with token:', token ? '✓' : '✗');

  async function refreshUser() {
    if (!token) {
      console.log('🔐 AuthContext: No token, clearing user');
      setUser(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    try {
      console.log('🔐 AuthContext: Fetching user data...');
      const data = await getCurrentUser();
      console.log('🔐 AuthContext: User fetched successfully:', data?.user?.username || data?.username);
      setUser(data && data.user ? data.user : data);
      return data;
    } catch (err) {
      console.error('🔐 AuthContext: Error refreshing user:', err.message);
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
    console.log('🔐 AuthContext: useEffect mounting, token:', token ? '✓' : '✗');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(credentials = {}) {
    // credentials: { email, password } or { username, password }
    console.log('🔐 AuthContext: Login attempt for:', credentials.email || credentials.username);
    setLoading(true);
    try {
      const data = await loginUser(credentials);
      const newToken = data && (data.token || data.accessToken);
      if (newToken) {
        console.log('🔐 AuthContext: Login successful, token received');
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        await refreshUser();
      } else if (data && data.user) {
        console.log('🔐 AuthContext: Login response received without token');
        setUser(data.user);
      }
      return data;
    } catch (err) {
      console.error('🔐 AuthContext: Login error:', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload = {}) {
    console.log('🔐 AuthContext: Register attempt for:', payload.email);
    setLoading(true);
    try {
      const data = await registerUser(payload);
      // optionally auto-login when register returns token
      const newToken = data && (data.token || data.accessToken);
      if (newToken) {
        console.log('🔐 AuthContext: Registration successful, token received');
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        await refreshUser();
      }
      return data;
    } catch (err) {
      console.error('🔐 AuthContext: Register error:', err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    console.log('🔐 AuthContext: Logout initiated');
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

  console.log('🔐 AuthContext: Current state -', { 
    hasUser: !!user, 
    hasToken: !!token, 
    loading,
    username: user?.username 
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('🔐 useAuth: Hook called outside AuthProvider!');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
