// src/utils/getViteEnv.js
// Utility to access Vite env vars in Vite-powered React apps
export function getViteEnv() {
  // Read Vite env in a Jest/Node-safe way (avoid direct import.meta in CJS parsing)
  const readImportMetaEnv = () => {
    try {
      // Access import.meta.env lazily inside a Function to prevent parse errors in Jest
      return Function('return (typeof import.meta !== "undefined" ? import.meta.env : undefined);')();
    } catch (err) {
      return undefined;
    }
  };

  const env =
    readImportMetaEnv() ||
    (typeof globalThis !== 'undefined' && globalThis.__VITE_ENV__) ||
    {};
  return {
    API_URL: env.VITE_API_URL || "http://localhost:5001/api",
    APP_NAME: env.VITE_APP_NAME || "PledgedHub",
    APP_VERSION: env.VITE_APP_VERSION || "1.0.0",
    NODE_ENV: env.MODE,
    DEBUG_AUTH: env.VITE_DEBUG_AUTH,
    DEBUG_API: env.VITE_DEBUG_API,
    DEBUG_UI: env.VITE_DEBUG_UI,
  };
}

