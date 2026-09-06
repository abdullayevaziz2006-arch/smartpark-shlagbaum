import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios base URL
axios.defaults.baseURL = window.location.origin;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set default authorization header if token exists
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('smartpark_token');
    if (!token) {
      setLoading(false);
      return;
    }

    setAuthHeader(token);
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Session expired or invalid token:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, user } = response.data;
      localStorage.setItem('smartpark_token', token);
      setAuthHeader(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Kirishda xatolik yuz berdi';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('smartpark_token');
    setAuthHeader(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
