import React, { createContext, useContext, useState, useEffect } from 'react';
import { hybridApi } from './hybridApi';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [apiHealth, setApiHealth] = useState({ nodeApi: 'unknown', graphql: 'unknown' });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        setUser(userData);
      } catch (error) {
        console.warn('Failed to parse user data from localStorage');
      }
    }

    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await hybridApi.healthCheck();
      setApiHealth({
        nodeApi: health.nodeApi.status === 'ok' ? 'healthy' : 'unhealthy',
        graphql: health.graphql.status === 'available' ? 'healthy' : 'unhealthy',
      });
    } catch (error) {
      setApiHealth({ nodeApi: 'unhealthy', graphql: 'unknown' });
    }
  };

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  const value = {
    user,
    login,
    logout,
    apiHealth,
    checkApiHealth,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};
