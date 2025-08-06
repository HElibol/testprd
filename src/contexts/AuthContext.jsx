import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = () => {
      const sessionId = getCookie('sessionId');
      if (sessionId) {
        setUser({ sessionId });
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (username, password) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.202:5000/api';
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      
      console.log('API Yanıtı:', response.data);
      
      if (response.data && response.data.success && response.data.data) {
        const { sessionId, message } = response.data.data;

        if (sessionId) {
          setCookie('sessionId', sessionId, {
            maxAge: 30 * 24 * 60 * 60,
            path: '/',
            sameSite: 'strict'
          });

          setUser({ sessionId, message });
        }

        return response.data;
      }
      
      return null;
    } catch (error) {
      console.error('Login hatası:', error);
      throw error;
    }
  };

  const logout = () => {
    deleteCookie('sessionId');
    setUser(null);
  };

  const isAuthenticated = () => {
    const sessionId = getCookie('sessionId');
    return !!sessionId;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};