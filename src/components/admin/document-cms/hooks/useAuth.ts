import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../types';

export function useDocumentAPIAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkAuth = useCallback(async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      } else {
        // 401 is expected when not authenticated - silently handle it
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      // Network errors are also expected - silently handle them
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        toast.success(`Welcome, ${data.user || username}!`);
        return true;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      toast.error(errorMessage);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return {
    isAuthenticated,
    isChecking,
    checkAuth,
    login,
    logout,
  };
}
