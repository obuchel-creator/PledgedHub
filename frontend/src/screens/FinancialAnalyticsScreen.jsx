import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import FinancialDashboard from '../components/FinancialDashboard';

export default function FinancialAnalyticsScreen() {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  // Only admin and staff can access financial analytics
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <FinancialDashboard />;
}
