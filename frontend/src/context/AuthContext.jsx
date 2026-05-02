import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../config';

const AuthContext = createContext();

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function onRefreshFailed() {
  refreshSubscribers.forEach(cb => cb(null));
  refreshSubscribers = [];
}

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API}/auth/me`, { credentials: 'include' });
      if (response.ok) {
        const userData = await response.json();
        const savedAvatar = localStorage.getItem(`avatar_${userData.email}`);
        if (savedAvatar) {
          userData.avatar = savedAvatar;
        }
        setUser(userData);
      }
    } catch (err) {
      console.error('Fetch user failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async () => {
    if (isRefreshing) {
      return new Promise(resolve => subscribeTokenRefresh(resolve));
    }
    isRefreshing = true;
    try {
      const response = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      const data = await response.json();
      onRefreshed('ok');
      return true;
    } catch (error) {
      setUser(null);
      onRefreshFailed();
      return false;
    } finally {
      isRefreshing = false;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      const userObj = data.user;
      const savedAvatar = localStorage.getItem(`avatar_${userObj.email}`);
      if (savedAvatar) {
        userObj.avatar = savedAvatar;
      }
      setUser(userObj);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    setUser(null);
  };

  const switchRole = (roleName) => {
    if (user) {
      const updated = { ...user, role: roleName };
      setUser(updated);
    }
  };

  // Expose refreshAccessToken for fetchWithAuth utility
  useEffect(() => {
    window.__refreshAccessToken = refreshAccessToken;
    return () => { delete window.__refreshAccessToken; };
  }, []);

  const updateAvatar = (dataUrl) => {
    if (user?.email) {
      localStorage.setItem(`avatar_${user.email}`, dataUrl);
      const updated = { ...user, avatar: dataUrl };
      setUser(updated);
    }
  };

  const removeAvatar = () => {
    if (user?.email) {
      localStorage.removeItem(`avatar_${user.email}`);
      const updated = { ...user, avatar: undefined };
      setUser(updated);
    }
  };

  const updateProfile = (updates) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, loading, updateAvatar, removeAvatar, updateProfile, refreshAccessToken }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export async function fetchWithAuth(url, options = {}) {
  if (!options.headers) options.headers = {};
  options.credentials = 'include';

  let response = await fetch(url, options);

  if (response.status === 401 && !options.skipRetry) {
    const refreshed = await window.__refreshAccessToken?.();
    if (refreshed) {
      response = await fetch(url, { ...options, skipRetry: true });
    } else {
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}
