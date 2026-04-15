/**
 * Small runtime env validation helper for frontend (Vite-friendly).
 *
 * Exports a single function `validateEnv(requiredKeys = ['VITE_API_URL'])`.
 * It checks Node/process.env (SSR) or Vite's import.meta.env (client) for required VITE_ keys.
 * Returns { ok: true } when all present or { ok: false, missing: [...] } when some are missing.
 * Logs a helpful console.warn with instructions to set env vars in .env when missing.
 *
 * Example (app boot):
 * import { validateEnv } from './utils/validateEnv';
 * const result = validateEnv(); // will console.warn if vars missing
 * if (!result.ok) {
 *   // handle missing vars (show UI message, disable features, etc.)
 * }
 */

import { getViteEnv } from './getViteEnv';

export function validateEnv(requiredKeys = ['VITE_API_URL']) {
  // Always use getViteEnv for env variables in frontend/browser
  const env = getViteEnv();

  const missing = requiredKeys.filter((key) => {
    // treat undefined or empty string as missing
    return !(key in env) || env[key] === undefined || env[key] === '';
  });

  if (missing.length > 0) {
    console.warn(
      `Missing environment variables required for the frontend: ${missing.join(
        ', ',
      )}.\nAdd them to a .env file at the project root (example):\n${missing
        .map((k) => `${k}="your_value_here"`)
        .join('\n')}\nNote: Vite only exposes variables prefixed with "VITE_" to the client.`,
    );
    return { ok: false, missing };
  }

  return { ok: true };
}
