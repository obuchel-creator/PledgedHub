/**
 * Normalize various error shapes into a plain object:
 *  { message: string, status?: number, details?: any }
 *
 * formatError may return a plain object or a Promise resolving to one
 * if parsing a Fetch Response body is required.
 *
 * @param {any} error - The error to normalize (Axios error, Fetch Response, Error, string, object...)
 * @param {Object} [options]
 * @param {string} [options.fallbackMessage='An unexpected error occurred']
 * @param {boolean} [options.includeStackInDev=true] - include stack/details only in development
 * @returns {Object|Promise<Object>}
 */
export function formatError(error, options = {}) {
  const { fallbackMessage = 'An unexpected error occurred', includeStackInDev = true } = options;

    // Use getViteEnv for frontend environment
    const env = getViteEnv();
    const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'dev';

  const safeStringify = (v) => {
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  };

  const makeResult = (message, status, details) => {
    const out = { message: message || fallbackMessage };
    if (typeof status === 'number') out.status = status;
    if (details !== undefined && isDev && includeStackInDev) out.details = details;
    return out;
  };

  // Axios-like errors (isAxiosError OR has response)
  if (error && (error.isAxiosError || (error.response && typeof error.response === 'object'))) {
    const res = error.response || {};
    const status = res.status;
    let message = fallbackMessage;
    let details;
    if (res.data !== undefined) {
      if (typeof res.data === 'string') message = res.data;
      else if (res.data && typeof res.data === 'object' && res.data.message)
        message = res.data.message;
      else message = safeStringify(res.data);
      details = res.data;
    } else if (error.message) {
      message = error.message;
    }
    if (error.stack && isDev && includeStackInDev) {
      details = details
        ? { ...(typeof details === 'object' ? details : { body: details }), stack: error.stack }
        : { stack: error.stack };
    }
    return makeResult(message, status, details);
  }

  // Fetch Response (ok === false and has status)
  const isFetchResponse = (obj) =>
    obj &&
    typeof obj === 'object' &&
    typeof obj.status === 'number' &&
    typeof obj.ok === 'boolean' &&
    typeof obj.text === 'function';
  if (isFetchResponse(error) && error.ok === false) {
    // we need to async parse body -> return a Promise
    return (async () => {
      let message = fallbackMessage;
      let details;
      const status = error.status;
      try {
        // Try parse JSON first
        const clone = typeof error.clone === 'function' ? error.clone() : error;
        try {
          const data = await clone.json();
          if (data) {
            if (typeof data === 'string') message = data;
            else if (data.message) message = data.message;
            else message = safeStringify(data);
            details = data;
          }
        } catch (e) {
          // JSON parse failed, try text
          try {
            const txt = await clone.text();
            if (txt) {
              message = txt;
              details = txt;
            }
          } catch (e2) {
            // ignore
          }
        }
      } catch (e) {
        // reading body failed, ignore
      }
      return makeResult(message, status, details);
    })();
  }

  // Native Error instance
  if (error instanceof Error || (error && error.message && typeof error.message === 'string')) {
    const message = (error && error.message) || fallbackMessage;
    const details =
      isDev && includeStackInDev
        ? { ...(error.stack ? { stack: error.stack } : {}), ...(isDev ? { raw: error } : {}) }
        : undefined;
    return makeResult(message, undefined, details);
  }

  // String
  if (typeof error === 'string') {
    return makeResult(error, undefined, undefined);
  }

  // Plain object or other
  if (error && typeof error === 'object') {
    const message = error.message || error.error || safeStringify(error);
    const details = isDev && includeStackInDev ? error : undefined;
    return makeResult(message, undefined, details);
  }

  // Fallback
  return makeResult(fallbackMessage, undefined, undefined);
}

/*
Usage examples:

// In an async catch block (handles both sync result and Promise result):
try {
    await apiCall();
} catch (rawErr) {
    const normalized = await Promise.resolve(formatError(rawErr));
    // show normalized.message in UI, optionally use normalized.status
    console.error(normalized);
}

// When using fetch Response handling:
fetch('/api/data').then(async res => {
    if (!res.ok) {
        const normalized = await formatError(res); // returns a Promise for Response
        showError(normalized.message);
    }
});
*/
