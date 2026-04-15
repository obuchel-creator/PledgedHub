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

export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  async function refreshUser() {
    if (!token) {
      setUser(null);
      setLoading(false);
      setInitialized(true);
      return null;
    }
    try {
      const response = await getCurrentUser();
      
      if (response && response.success === false) {
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        setLoading(false);
        setInitialized(true);
        return null;
      }

      if (response && response.status && response.status >= 400) {
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
        setLoading(false);
        setInitialized(true);
        return null;
      }
      
      const data = response?.data || response;
      const userObj = data?.user || data;
      
      if (userObj && userObj.id) {
        if (!userObj.phone && userObj.phone_number) {
          userObj.phone = userObj.phone_number;
        }
        if (!userObj.role) {
          userObj.role = 'user';
        }
        setUser(userObj);
      } else {
        setUser(null);
      }
      setLoading(false);
      setInitialized(true);
      return userObj;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error refreshing user:', err.message);
      }
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
      setLoading(false);
      setInitialized(true);
      return null;
    }
  }

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      if (token && !user && !loading && initialized) {
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      }
    };
    validateToken();
  }, [token, user, loading, initialized]);

  async function login(credentials = {}) {
    setLoading(true);
    try {
      const data = await loginUser(credentials);
      if (data && data.success === false) {
        return data;
      }
      const newToken = data && (data.token || data.accessToken);
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        if (data.user) {
          const userObj = { ...data.user };
          if (!userObj.phone && userObj.phone_number) {
            userObj.phone = userObj.phone_number;
          }
          if (!userObj.role) {
            userObj.role = 'user';
          }
          setUser(userObj);
          setLoading(false);
          setInitialized(true);
        } else {
          setLoading(false);
        }
        return data;
      } else if (data && data.user) {
        setUser(data.user);
        return data;
      } else {
        return { success: false, error: 'Unexpected response from server' };
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Login error:', err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(payload = {}) {
    setLoading(true);
    try {
      const data = await registerUser(payload);
      
      if (data && (data.success === false || data.error)) {
        return data;
      }
      
      const newToken = data && (data.token || data.accessToken);
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        await refreshUser();
      }
      return data;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Register error:', err.message);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


