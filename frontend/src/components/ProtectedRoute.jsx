import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasRole, hasPermission } from '../utils/rbac';

/**
 * ProtectedRoute Component - Enhanced with RBAC
 * 
 * Protects routes based on user role and/or permissions
 * 
 * Usage:
 *   <ProtectedRoute requiredRole="finance_admin">
 *     <PayoutApprovalScreen />
 *   </ProtectedRoute>
 * 
 *   <ProtectedRoute requiredRoles={['creator', 'super_admin']}>
 *     <CampaignScreen />
 *   </ProtectedRoute>
 * 
 *   <ProtectedRoute requiredPermission="approve_payouts">
 *     <ApprovePayoutButton />
 *   </ProtectedRoute>
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  requiredRoles = null,
  requiredPermission = null,
  fallback = null
}) => {
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
        <div>⏳ Loading authentication...</div>
      </div>
    );
  }
  
  // After loading is complete, check if user has token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole || requiredRoles) {
    const roleToCheck = requiredRoles || requiredRole;
    const userRole = user?.role || 'donor';
    
    if (!hasRole(userRole, roleToCheck)) {
      console.warn(
        `🚫 ProtectedRoute: Access denied for role '${userRole}', required:`,
        roleToCheck
      );
      
      if (fallback) {
        return fallback;
      }
      
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission-based access
  if (requiredPermission) {
    const userRole = user?.role || 'donor';
    
    if (!hasPermission(userRole, requiredPermission)) {
      console.warn(
        `🚫 ProtectedRoute: User lacks permission '${requiredPermission}' for role '${userRole}'`
      );
      
      if (fallback) {
        return fallback;
      }
      
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // All checks passed, render protected content
  return children;
};

export default ProtectedRoute;



