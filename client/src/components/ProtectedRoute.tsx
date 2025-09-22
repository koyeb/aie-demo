import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLogin } from '@/components/AdminLogin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <>{children}</>;
}