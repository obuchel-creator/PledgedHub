import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

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
import HelpScreen from './screens/HelpScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import TermsScreen from './screens/TermsScreen';
import VerifyPledgeScreen from './screens/VerifyPledgeScreen';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/create" element={<CreatePledgeScreen />} />
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <CampaignsScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/fundraising" element={<FundraisingScreen />} />
        <Route path="/campaign/:slug" element={<GuestPledgeScreen />} />
        <Route path="/pledges/:id" element={<PledgeDetailScreen />} />
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
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentInitiationScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/help" element={<HelpScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route path="/terms" element={<TermsScreen />} />
        <Route path="/verify-pledge" element={<VerifyPledgeScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </Router>
  );
}

export default App;


