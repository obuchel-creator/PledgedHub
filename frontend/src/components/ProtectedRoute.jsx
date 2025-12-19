import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { token, user, loading } = useAuth();
  
  // Wait for initial auth check to complete
  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // After loading is complete, check if user has token
  if (!token) {
    console.log('🔐 ProtectedRoute: No token, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    const userRole = user?.role;
    const isAuthorized = requiredRole === 'admin' 
      ? (userRole === 'admin' || userRole === 'superadmin' || userRole === 'staff')
      : userRole === requiredRole;
    
    if (!isAuthorized) {
      console.log('🔐 ProtectedRoute: User lacks required role:', requiredRole, 'has:', userRole);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // All checks passed, render protected content
  return children;
};

export default ProtectedRoute;



