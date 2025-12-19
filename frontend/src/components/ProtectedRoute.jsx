import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { token, user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }
  
  if (!token) {
    console.log('🔐 ProtectedRoute: No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    // Check if user has the required role (admin or superadmin both qualify for admin-required routes)
    const userRole = user?.role;
    const isAuthorized = requiredRole === 'admin' 
      ? (userRole === 'admin' || userRole === 'superadmin' || userRole === 'staff')
      : userRole === requiredRole;
    
    if (!isAuthorized) {
      console.log('🔐 ProtectedRoute: User lacks required role:', requiredRole, 'has:', userRole);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;



