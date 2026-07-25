import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';

interface AdminRouteProps {
  children: ReactNode;
}

/** Protects admin routes — redirects to /admin if not authenticated */
export function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated } = useAdmin();
  if (!isAuthenticated) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
