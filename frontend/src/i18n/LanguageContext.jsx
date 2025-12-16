import React, { createContext, useContext, useState, useEffect } from 'react';
import { t } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Get language from localStorage or default to English
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'en';
  });

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    // Also update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  // Translation function that uses current language
  const translate = (key) => {
    return t(key, language);
  };

  const changeLanguage = (newLang) => {
    if (['en', 'lg', 'sw'].includes(newLang)) {
      setLanguage(newLang);
    }
  };

  const value = {
    language,
    setLanguage: changeLanguage,
    t: translate,
    // Export language names
    languages: {
      en: 'English',
      lg: 'Luganda',
      sw: 'Swahili'
    }
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
