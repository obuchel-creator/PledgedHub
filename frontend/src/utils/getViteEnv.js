// src/utils/getViteEnv.js
// Utility to access Vite env vars in Vite-powered React apps
export function getViteEnv() {
  // Use Function constructor to avoid parse-time import.meta reference
  let env = {};
  try {
    env = Function('try { return import.meta.env || {}; } catch { return {}; }')();
  } catch (e) {
    // Not in ESM context, ignore
  }
  if (!env || Object.keys(env).length === 0) {
    env = globalThis.__VITE_ENV__ ? globalThis.__VITE_ENV__ : {};
  }
  return {
    API_URL: env.VITE_API_URL || "http://localhost:5001/api",
    APP_NAME: env.VITE_APP_NAME || "PledgeHub",
    APP_VERSION: env.VITE_APP_VERSION || "1.0.0",
    NODE_ENV: env.MODE,
  };
}

