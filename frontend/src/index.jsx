import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/theme.css';
import './styles/globals.css';
import './styles/mobile-optimizations.css';

console.log('✓ index.jsx loaded');
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

const rootElement = document.getElementById('root');
console.log('✓ Root element found:', !!rootElement);

if (rootElement) {
  try {
    console.log('✓ Creating React root...');
    const root = createRoot(rootElement);
    console.log('✓ React root created');
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('✓ App rendered successfully');
  } catch (error) {
    console.error('✗ Error rendering app:', error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;"><h2>Error Loading App</h2><p>${error.message}</p></div>`;
  }
} else {
  console.error('✗ Root element not found!');
}
