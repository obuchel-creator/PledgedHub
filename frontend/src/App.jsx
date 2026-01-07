import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Global error logging
// Removed debug log
window.addEventListener('error', (event) => {
  window.alert('A global error occurred. See console for details.');
});
window.addEventListener('unhandledrejection', (event) => {
  window.alert('An unhandled promise rejection occurred. See console for details.');
});

// Design System Imports
import './styles/modern-design-system.css';
import './styles/globals.css';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import CampaignsScreen from './screens/CampaignsScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import CreatePledgeScreen from './screens/CreatePledgeScreen';
import AboutScreen from './screens/AboutScreen';
import PledgeDetailScreen from './screens/PledgeDetailScreen';
import PledgesScreen from './screens/PledgesScreen';
import AdvancedAnalyticsScreen from './screens/AdvancedAnalyticsScreen';
import FundraisingScreen from './screens/FundraisingScreen';
import AccountingScreen from './screens/AccountingScreen';
import { AccountingDashboardScreen } from './screens/AccountingDashboardScreen';
import { ChartOfAccountsScreen } from './screens/ChartOfAccountsScreen';
import CommissionDashboardScreen from './screens/CommissionDashboardScreen';
import SecuritySettingsScreen from './screens/SecuritySettingsScreen';
import PaymentInitiationScreen from './screens/PaymentInitiationScreen';
import GuestPledgeScreen from './screens/GuestPledgeScreen';
import CashAccountabilityDashboard from './screens/CashAccountabilityDashboard';
import NotFoundScreen from './screens/NotFoundScreen';
import ExploreScreen from './screens/ExploreScreen';
import HelpScreen from './screens/HelpScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import TermsScreen from './screens/TermsScreen';
import VerifyPledgeScreen from './screens/VerifyPledgeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SharePledgeScreen from './screens/SharePledgeScreen';
import PricingScreen from './screens/PricingScreen';

function App() {
  // Removed debug log
  return (
    <Router>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 60px - 48px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/create" element={
          <ProtectedRoute>
            <CreatePledgeScreen />
          </ProtectedRoute>
        } />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <CampaignsScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/explore" element={<ExploreScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/fundraising" element={<FundraisingScreen />} />
        <Route path="/campaign/:slug" element={<GuestPledgeScreen />} />
        <Route path="/campaigns/:id" element={<GuestPledgeScreen />} />
        <Route path="/pledges/:id" element={
          <ProtectedRoute>
            <PledgeDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/pledge/:id" element={
          <ProtectedRoute>
            <PledgeDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/pledges" element={
          <ProtectedRoute>
            <PledgesScreen />
          </ProtectedRoute>
        } />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AdvancedAnalyticsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounting"
          element={
            <ProtectedRoute requiredRole="admin">
              <AccountingScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounting/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AccountingDashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounting/chart-of-accounts"
          element={
            <ProtectedRoute requiredRole="admin">
              <ChartOfAccountsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/commissions"
          element={
            <ProtectedRoute requiredRole="admin">
              <CommissionDashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cash-accountability"
          element={
            <ProtectedRoute requiredRole="admin">
              <CashAccountabilityDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security"
          element={
            <ProtectedRoute requiredRole="admin">
              <SecuritySettingsScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/payment" element={
          <ProtectedRoute>
            <PaymentInitiationScreen />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileScreen />
          </ProtectedRoute>
        } />
        <Route path="/help" element={<HelpScreen />} />
        <Route path="/pricing" element={<PricingScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route path="/terms" element={<TermsScreen />} />
        <Route path="/verify-pledge" element={<VerifyPledgeScreen />} />
        <Route path="/share/pledge/:id" element={<SharePledgeScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
          </Routes>
        </div>
        <footer style={{ background: '#f8fafc', color: '#1e293b', textAlign: 'center', padding: '1.2rem 0', fontSize: '1.08rem', borderTop: '2px solid #e5e7eb', fontWeight: 'bold', letterSpacing: '0.02em', textShadow: '0 1px 6px #fff, 0 1px 1px #e5e7eb' }}>
          &copy; {new Date().getFullYear()} PledgeHub. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;


