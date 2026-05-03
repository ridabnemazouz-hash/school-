import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export function SmartRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isPlatformOwner = user.role === 'Super Admin' && !user.school_id;
  if (isPlatformOwner) return <Navigate to="/" replace />;

  return <Navigate to="/school" replace />;
}
