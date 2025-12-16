import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

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
import CommissionDashboardScreen from './screens/CommissionDashboardScreen';
import SecuritySettingsScreen from './screens/SecuritySettingsScreen';
import PaymentInitiationScreen from './screens/PaymentInitiationScreen';
import GuestPledgeScreen from './screens/GuestPledgeScreen';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/create" element={<CreatePledgeScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/fundraising" element={<FundraisingScreen />} />
          <Route path="/campaign/:slug" element={<GuestPledgeScreen />} />
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
            path="/commissions"
            element={
              <ProtectedRoute requiredRole="admin">
                <CommissionDashboardScreen />
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
          <Route path="/campaigns" element={<CampaignsScreen />} />
          <Route path="/pledges/:id" element={<PledgeDetailScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/reset-password" element={<ResetPasswordScreen />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
