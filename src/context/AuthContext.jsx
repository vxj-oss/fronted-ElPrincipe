import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = Boolean(user);

  useEffect(() => {
    async function verifySession() {
      try {
        const userData = await apiRequest('/auth/me');
        const normalizedUser = {
          ...userData,
          nombreCompleto: userData.nombre_completo,
          cargo: userData.rol === 'administrador' ? 'Administrador General' : 'Asesor Comercial',
          permisos: [
            'dashboard',
            'agent',
            'products',
            'customers',
            'customer_requests',
            'orders',
            'commercial_terms',
            'indicators',
            'reports',
            'history',
            'profile',
            'settings',
          ],
        };
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      } catch {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    }
    verifySession();
  }, []);

  const login = useCallback(async (nombre_usuario, password) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ nombre_usuario, password }),
      });

      const userData = await apiRequest('/auth/me');
      const normalizedUser = {
        ...userData,
        nombreCompleto: userData.nombre_completo,
        cargo: userData.rol === 'administrador' ? 'Administrador General' : 'Asesor Comercial',
        permisos: [
          'dashboard',
          'agent',
          'products',
          'customers',
          'customer_requests',
          'orders',
          'commercial_terms',
          'indicators',
          'reports',
          'history',
          'profile',
          'settings',
        ],
      };

      setUser(normalizedUser);
      localStorage.setItem('user', JSON.stringify(normalizedUser));

      return { ok: true };
    } catch (err) {
      const msg = err.message || 'Credenciales incorrectas o usuario inactivo';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // si falla la llamada de red, igual limpiamos la sesión local
    }
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export default AuthContext;