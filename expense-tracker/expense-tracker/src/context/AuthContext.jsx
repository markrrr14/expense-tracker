import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, getToken, setToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!getToken()) {
        setInitializing(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener('auth:unauthorized', expire);
    return () => window.removeEventListener('auth:unauthorized', expire);
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* token may already be invalid */
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
