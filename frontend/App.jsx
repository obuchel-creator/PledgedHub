import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CreatePledgeScreen from './src/screens/CreatePledgeScreen';
import PledgeDetailScreen from './src/screens/PledgeDetailScreen';
import CreateCampaignScreen from './src/screens/CreateCampaignScreen';
// import AnalyticsDashboardScreen from './src/screens/AnalyticsDashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import HelpScreen from './src/screens/HelpScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import TermsScreen from './src/screens/TermsScreen';
import AboutScreen from './src/screens/AboutScreen';
import OAuthCallbackScreen from './src/screens/OAuthCallbackScreen';
import UnauthorizedScreen from './src/screens/UnauthorizedScreen';
import NotFoundScreen from './src/screens/NotFoundScreen';
import NavBar from './NavBar';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />
        <Route path="/oauth/callback" element={<OAuthCallbackScreen />} />
        <Route path="/help" element={<HelpScreen />} />
        <Route path="/privacy" element={<PrivacyScreen />} />
        <Route path="/terms" element={<TermsScreen />} />
        <Route path="/about" element={<AboutScreen />} />
        <Route path="/unauthorized" element={<UnauthorizedScreen />} />
        <Route path="/dashboard" element={<><NavBar /><DashboardScreen /></>} />
        <Route path="/create-pledge" element={<><NavBar /><CreatePledgeScreen /></>} />
        <Route path="/pledges/:id" element={<><NavBar /><PledgeDetailScreen /></>} />
        <Route path="/create-campaign" element={<><NavBar /><CreateCampaignScreen /></>} />
        <Route path="/campaigns/:id" element={<><NavBar /><CreateCampaignScreen /></>} />
        {/* <Route path="/analytics" element={<><NavBar /><AnalyticsDashboardScreen /></>} /> */}
        <Route path="/profile" element={<><NavBar /><ProfileScreen /></>} />
        <Route path="/settings" element={<><NavBar /><SettingsScreen /></>} />
        <Route path="/users" element={<><NavBar /><UserManagementScreen /></>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
