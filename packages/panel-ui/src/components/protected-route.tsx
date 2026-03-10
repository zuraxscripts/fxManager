import { useAuth } from '@/hooks/use-auth';
import type { ProtectedRouteProps } from '@/types/auth';
import { Navigate } from 'react-router-dom';
import { LoadingScreen } from './loading';

export function ProtectedRoute({ element: Element }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen message='Loading session' />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Element />;
}
