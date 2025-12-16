/**
 * tests/mocks/morgan.js
 *
 * A lightweight, robust mock of the `morgan` HTTP request logger for tests.
 * Mimics the real API enough for most unit/integration tests:
 *   - morgan(format, options) -> middleware(req, res, next)
 *   - morgan.token(name, fn)
 *   - morgan.format(name, fmt)
 *   - morgan.compile(fmt) -> function(req, res, info)
 *   - utilities: getLogs(), clearLogs(), lastLog(), setStream(stream), restoreDefaults()
 *
 * The middleware supports:
 *   - options.stream (object with write(string))
 *   - options.immediate (log on request start instead of on 'finish')
 *
 * Stored logs are objects: { text, tokens, req, res, meta }
 *
 * Usage in tests:
 *   const morgan = require('../../tests/mocks/morgan');
 *   app.use(morgan('dev'));
 *   morgan.getLogs(); // inspect
 */

const DEFAULT_STREAM = { write: () => {} };

const logs = [];
let defaultStream = DEFAULT_STREAM;

const tokens = new Map();
const formats = new Map();

// Helper: safe getter for nested header keys for req/res token like req[X-Header]
function headerGetter(obj, field) {
    if (!obj) return undefined;
    const key = field.toLowerCase();
    // req.headers is typical; res.getHeader exists
    if (obj.headers && typeof obj.headers === 'object') {
        return obj.headers[key];
    }
    if (typeof obj.getHeader === 'function') {
        return obj.getHeader(field) || obj.getHeader(key);
    }
    return undefined;
}

// Default tokens (simple but useful)
tokens.set('method', (req) => req && req.method);
tokens.set('url', (req) => (req && (req.url || (req.originalUrl || req.path))));
tokens.set('status', (req, res) => (res && (res.statusCode || res.status)));
tokens.set('response-time', (req, res, meta) => {
    if (!meta || typeof meta._startAt === 'undefined') return undefined;
    const diff = process.hrtime(meta._startAt);
    const ms = (diff[0] * 1e3) + (diff[1] / 1e6);
    return ms.toFixed(3);
});
tokens.set('remote-addr', (req) => {
    if (!req) return undefined;
    return req.ip || req.connection && (req.connection.remoteAddress || req.socket && req.socket.remoteAddress) || req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']);
});
tokens.set('date', () => new Date().toISOString());
tokens.set('user-agent', (req) => req && (req.headers && (req.headers['user-agent'] || req.headers['User-Agent'])));

// Default simple formats
formats.set('dev', (req, res, meta) => {
    const method = tokens.get('method')(req);
    const url = tokens.get('url')(req);
    const status = tokens.get('status')(req, res) || '-';
    const rt = tokens.get('response-time')(req, res, meta) || '-';
    return `${method} ${url} ${status} - ${rt} ms`;
});
formats.set('combined', (req, res, meta) => {
    const ip = tokens.get('remote-addr')(req) || '-';
    const user = '-';
    const date = new Date().toUTCString();
    const method = tokens.get('method')(req) || '-';
    const url = tokens.get('url')(req) || '-';
    const status = tokens.get('status')(req, res) || '-';
    const length = (res && (res.getHeader && res.getHeader('content-length') || res.headers && res.headers['content-length'])) || '-';
    const ref = (req && req.headers && (req.headers.referer || req.headers.referrer)) || '-';
    const ua = tokens.get('user-agent')(req) || '-';
    return `${ip} - ${user} [${date}] "${method} ${url} HTTP/1.1" ${status} ${length} "${ref}" "${ua}"`;
});
formats.set('common', (req, res, meta) => {
    const method = tokens.get('method')(req) || '-';
    const url = tokens.get('url')(req) || '-';
    const status = tokens.get('status')(req, res) || '-';
    const length = (res && (res.getHeader && res.getHeader('content-length') || res.headers && res.headers['content-length'])) || '-';
    return `${method} ${url} ${status} ${length}`;
});
formats.set('short', formats.get('dev'));
formats.set('tiny', (req, res, meta) => {
    const method = tokens.get('method')(req) || '-';
    const url = tokens.get('url')(req) || '-';
    const status = tokens.get('status')(req, res) || '-';
    const length = (res && (res.getHeader && res.getHeader('content-length') || res.headers && res.headers['content-length'])) || '-';
    return `${method} ${url} ${status} ${length}`;
});

// compile: accept a format string possibly containing tokens like :method, :req[header], :res[header]
function compile(formatStr) {
    if (typeof formatStr !== 'string') {
        // if already a function-like object, just return passthrough
        return formatStr;
    }

    // regex matches :req[Header], :res[Header], or :tokenName
    const tokenRegex = /:(req|res)\[([^\]]+)\]|:([A-Za-z_][A-Za-z0-9_-]*)/g;

    return function compiled(req, res, meta = {}) {
        return formatStr.replace(tokenRegex, (_, which, header, tokenName) => {
            if (which && header) {
                if (which === 'req') return headerGetter(req, header) || '-';
                if (which === 'res') return headerGetter(res, header) || '-';
            }
            if (tokenName) {
                const t = tokens.get(tokenName);
                if (t) return (t(req, res, meta) || '-');
                return '-';
            }
            return '-';
        });
    };
}

// Core morgan mock function
function morgan(format, options = {}) {
    // determine formatter
    let formatter;
    if (typeof format === 'function') {
        formatter = format;
    } else if (typeof format === 'string' && formats.has(format)) {
        formatter = formats.get(format);
    } else if (typeof format === 'string') {
        // treat as a format string for compile
        formatter = compile(format);
    } else {
        formatter = formats.get('dev');
    }

    const stream = (options && options.stream) || defaultStream;

    return function middleware(req = {}, res = {}, next) {
        // meta object for response-time etc.
        const meta = {};
        meta._startAt = process.hrtime();

        let logged = false;
        function doLog() {
            if (logged) return;
            logged = true;

            try {
                const text = formatter(req, res, meta);
                const entry = { text, tokens: {}, req, res, meta, timestamp: Date.now() };
                // capture token values for inspection
                for (const [name, fn] of tokens.entries()) {
                    try {
                        entry.tokens[name] = fn(req, res, meta);
                    } catch (e) {
                        entry.tokens[name] = undefined;
                    }
                }
                logs.push(entry);
                // write to provided stream if available
                try {
                    if (stream && typeof stream.write === 'function') {
                        stream.write(String(text) + '\n');
                    }
                } catch (e) {
                    // swallow stream errors in tests
                }
            } catch (err) {
                // swallow formatter errors to avoid breaking tests
            }
        }

        if (options && options.immediate) {
            doLog();
        } else {
            // if res is an EventEmitter-like, attach finish listener; else log after next()
            const finishEvent = (res && typeof res.on === 'function');
            if (finishEvent) {
                const onFinish = () => {
                    res.removeListener && res.removeListener('finish', onFinish);
                    doLog();
                };
                res.on('finish', onFinish);
                // also handle 'close' to be safe
                const onClose = () => {
                    res.removeListener && res.removeListener('close', onClose);
                    doLog();
                };
                res.on('close', onClose);
            } else {
                // if res has no events, fallback to calling next and then logging
                // but don't block: call next first, then log in next tick
            }
        }

        // allow test code to set status / headers in next; preserve Node-style next
        if (typeof next === 'function') {
            // If res doesn't emit finish, ensure logging after next
            const finishEvent = (res && typeof res.on === 'function');
            if (!finishEvent) {
                // call next and then schedule a microtask to log
                try {
                    next();
                } finally {
                    // ensure log occurs after next's synchronous work
                    process.nextTick(() => {
                        doLog();
                    });
                }
            } else {
                next();
            }
        } // if no next provided, do nothing else
    };
}

// Attach token registration
morgan.token = function (name, fn) {
    if (typeof name !== 'string' || typeof fn !== 'function') {
        throw new TypeError('morgan.token(name, fn) expects (string, function)');
    }
    tokens.set(name, fn);
    return this;
};

// Attach format registration
morgan.format = function (name, fmt) {
    if (typeof name !== 'string') throw new TypeError('morgan.format(name, fmt) expects name string');
    if (typeof fmt === 'function') formats.set(name, fmt);
    else if (typeof fmt === 'string') formats.set(name, compile(fmt));
    else throw new TypeError('fmt must be string or function');
    return this;
};

// expose compile
morgan.compile = compile;

// Utilities for tests
morgan._internal = {
    _tokens: tokens,
    _formats: formats,
};

morgan.getLogs = function () {
    return logs.slice();
};

morgan.clearLogs = function () {
    logs.length = 0;
};

morgan.lastLog = function () {
    return logs.length ? logs[logs.length - 1] : undefined;
};

morgan.setStream = function (stream) {
    defaultStream = stream && typeof stream.write === 'function' ? stream : DEFAULT_STREAM;
};

morgan.getDefaultStream = function () {
    return defaultStream;
};

morgan.restoreDefaults = function () {
    logs.length = 0;
    defaultStream = DEFAULT_STREAM;
    // reset tokens and formats to initial values by clearing and re-adding defaults
    tokens.clear();
    tokens.set('method', (req) => req && req.method);
    tokens.set('url', (req) => (req && (req.url || (req.originalUrl || req.path))));
    tokens.set('status', (req, res) => (res && (res.statusCode || res.status)));
    tokens.set('response-time', (req, res, meta) => {
        if (!meta || typeof meta._startAt === 'undefined') return undefined;
        const diff = process.hrtime(meta._startAt);
        const ms = (diff[0] * 1e3) + (diff[1] / 1e6);
        return ms.toFixed(3);
    });
    tokens.set('remote-addr', (req) => {
        if (!req) return undefined;
        return req.ip || req.connection && (req.connection.remoteAddress || req.socket && req.socket.remoteAddress) || req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip']);
    });
    tokens.set('date', () => new Date().toISOString());
    tokens.set('user-agent', (req) => req && (req.headers && (req.headers['user-agent'] || req.headers['User-Agent'])));

    formats.clear();
    formats.set('dev', (req, res, meta) => {
        const method = tokens.get('method')(req);
        const url = tokens.get('url')(req);
        const status = tokens.get('status')(req, res) || '-';
        const rt = tokens.get('response-time')(req, res, meta) || '-';
        return `${method} ${url} ${status} - ${rt} ms`;
    });
    formats.set('combined', (req, res, meta) => {
        const ip = tokens.get('remote-addr')(req) || '-';
        const user = '-';
        const date = new Date().toUTCString();
        const method = tokens.get('method')(req) || '-';
        const url = tokens.get('url')(req) || '-';
        const status = tokens.get('status')(req, res) || '-';
        const length = (res && (res.getHeader && res.getHeader('content-length') || res.headers && res.headers['content-length'])) || '-';
        const ref = (req && req.headers && (req.headers.referer || req.headers.referrer)) || '-';
        const ua = tokens.get('user-agent')(req) || '-';
        return `${ip} - ${user} [${date}] "${method} ${url} HTTP/1.1" ${status} ${length} "${ref}" "${ua}"`;
    });
    formats.set('common', (req, res, meta) => {
        const method = tokens.get('method')(req) || '-';
        const url = tokens.get('url')(req) || '-';
        const status = tokens.get('status')(req, res) || '-';
        const length = (res && (res.getHeader && res.getHeader('content-length') || res.headers && res.headers['content-length'])) || '-';
        return `${method} ${url} ${status} ${length}`;
    });
    formats.set('short', formats.get('dev'));
    formats.set('tiny', (req, res, meta) => {
        const method = tokens.get('method')(req) || '-';
        const url = tokens.get('url')(req) || '-';
        const status = tokens.get('status')(req, res) || '-';
        const length = (res && (res.getHeader && res.getHeader('content-length') || res.headers && res.headers['content-length'])) || '-';
        return `${method} ${url} ${status} ${length}`;
    });

    return this;
};

module.exports = morgan;