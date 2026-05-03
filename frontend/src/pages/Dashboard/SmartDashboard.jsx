import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { OwnerDashboard } from './OwnerDashboard';
import { DashboardHome } from './DashboardHome';

export function SmartDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const isPlatformOwner = user.role === 'Super Admin' && !user.school_id;

  if (isPlatformOwner) {
    return <OwnerDashboard />;
  }

  return <DashboardHome />;
}
