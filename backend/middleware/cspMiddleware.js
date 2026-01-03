// CSP middleware for Express.js
// Adds a strict Content-Security-Policy header for all responses

module.exports = function cspMiddleware(req, res, next) {
  // You can generate a nonce per request for inline scripts if needed:
  // const nonce = crypto.randomBytes(16).toString('base64');
  // res.locals.nonce = nonce;
  // For now, we avoid inline scripts entirely for best security.

  // Allow Vite dev server websocket in development
  const isDev = process.env.NODE_ENV !== 'production';
  const viteWs = isDev ? "ws://localhost:5173" : null;

  const csp = [
    "default-src 'self'",
    // In dev mode, Vite needs 'unsafe-eval' for HMR. Only allow scripts from self and Google OAuth
    isDev
      ? "script-src 'self' 'unsafe-eval' https://accounts.google.com https://www.gstatic.com"
      : "script-src 'self' https://accounts.google.com https://www.gstatic.com",
    // In production, avoid 'unsafe-inline'. In dev, Vite injects inline styles for HMR, so allow it only in dev.
    isDev
      ? "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
      : "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.googleusercontent.com",
    // Allow API, Google OAuth, and Vite dev server websocket in dev
    [
      "connect-src 'self' http://localhost:5001 https://accounts.google.com https://www.googleapis.com",
      viteWs
    ].filter(Boolean).join(' '),
    "frame-src https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "manifest-src 'self'",
    "prefetch-src 'self'",
    "upgrade-insecure-requests"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  next();
};
