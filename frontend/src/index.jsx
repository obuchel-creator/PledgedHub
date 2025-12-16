import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App.jsx';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import './styles/theme.css'; // theme styles
import './styles/globals.css'; // global styles
import './styles/mobile-optimizations.css'; // mobile-friendly optimizations

// Apply theme on initial load
const applyInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  
  if (savedTheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-theme', prefersDark);
    document.body.classList.toggle('light-theme', !prefersDark);
  } else if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
  } else {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
  }
};

applyInitialTheme();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
