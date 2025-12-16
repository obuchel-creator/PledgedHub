// Polyfill for TextEncoder/TextDecoder in Jest (Node <18)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill import.meta.env for Vite in Jest (CommonJS safe)
// Instead of using import.meta, define a global for getViteEnv fallback
globalThis.__VITE_ENV__ = {
  VITE_API_URL: 'http://localhost:5001/api',
  VITE_APP_NAME: 'Omukwano Pledge',
  VITE_APP_VERSION: '1.0.0',
  MODE: 'test',
};
