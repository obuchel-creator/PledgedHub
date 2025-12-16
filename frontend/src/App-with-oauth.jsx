import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import OAuthButtons from './components/OAuthButtons';
import AuthCallback from './components/AuthCallback';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.2rem',
          color: '#666',
        }}
      >
        🔄 Loading...
      </div>
    );
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

/**
 * Login Page Component
 */
const LoginPage = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '2rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>Omukwano Pledge</h1>
        <p style={{ color: '#666' }}>Pledge Management System</p>
      </div>
      <OAuthButtons />
    </div>
  );
};

/**
 * Dashboard Component (placeholder)
 */
const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Dashboard</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Welcome back, {user?.name || user?.email}!
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            background: '#ea4335',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </header>

      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h2>User Information</h2>
        <div
          style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '6px',
            marginTop: '1rem',
          }}
        >
          <pre style={{ margin: 0, fontSize: '0.9rem' }}>{JSON.stringify(user, null, 2)}</pre>
        </div>

        <h3 style={{ marginTop: '2rem' }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            style={{
              background: '#4285f4',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Create Pledge
          </button>
          <button
            style={{
              background: '#34a853',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main App Component with OAuth Integration
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>

        <style jsx global>{`
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family:
              -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
              'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background: #f8f9fa;
          }

          .App {
            min-height: 100vh;
          }

          button {
            font-family: inherit;
          }

          button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            transition: all 0.2s ease;
          }

          button:active {
            transform: translateY(0);
          }
        `}</style>
      </Router>
    </AuthProvider>
  );
}

export default App;
