import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import AnalyticsDashboard from '../AnalyticsDashboard';

export default function AnalyticsDashboardScreen() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <AnalyticsDashboard />;
}


