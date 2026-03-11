import { AuthContext } from '@/hooks/use-auth';
import { QueryService } from '@/lib/query';
import type { ApiError } from '@/types/api';
import type { AuthUser } from '@/types/auth';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const me = await QueryService({ endpoint: '/auth/me', method: 'GET' });
        setUser(me);
      } catch (err) {
        const status = (err as ApiError).status;
        if (status !== 401) console.error('Unable to check status', status);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      await QueryService({
        endpoint: '/auth/login',
        method: 'POST',
        body: { username, password },
      });
      const me = await QueryService({ endpoint: '/auth/me', method: 'GET' });
      setUser(me);
      navigate('/dashboard');
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    await QueryService({
      endpoint: '/auth/logout',
      method: 'POST',
    });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}
