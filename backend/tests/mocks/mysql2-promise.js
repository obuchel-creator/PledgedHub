/**
 * tests/mocks/mysql2-promise.js
 *
 * A simple, configurable mock for 'mysql2/promise' for unit tests.
 *
 * Usage:
 *   const mysql = require('../tests/mocks/mysql2-promise');
 *   const pool = mysql.createPool(...);
 *
 * Helpers:
 *   mysql.__setQueryResult(matcher, result)   // matcher: string or RegExp
 *   mysql.__setQueryError(matcher, error)
 *   mysql.__setDefaultResult(result)
 *   mysql.__getExecutedQueries() -> [{ sql, params }]
 *   mysql.__resetMocks()
 *
 * Handlers receive (sql, params) and should return either:
 *   - [rows, fields]  (sync)
 *   - Promise<[rows, fields]> (async)
 *
 * Default behavior: returns [[], []] for unknown queries.
 */

const executedQueries = [];
const handlers = []; // { matcher, fn }
let defaultResult = [[], []];

function _matchHandler(sql) {
    for (let i = handlers.length - 1; i >= 0; i--) {
        const { matcher, fn } = handlers[i];
        if (typeof matcher === 'string' && matcher === sql) return fn;
        if (matcher instanceof RegExp && matcher.test(sql)) return fn;
        if (typeof matcher === 'function' && matcher(sql)) return fn;
    }
    return null;
}

async function _runHandler(sql, params) {
    executedQueries.push({ sql, params: params || [] });
    const fn = _matchHandler(sql);
    if (!fn) {
        return cloneResult(defaultResult);
    }
    const res = fn(sql, params || []);
    // allow sync or promise-returning handlers
    return res instanceof Promise ? await res : cloneResult(res);
}

function cloneResult(result) {
    // shallow clone arrays to avoid mutation in tests
    if (!Array.isArray(result)) return [result, []];
    return [Array.isArray(result[0]) ? result[0].slice() : result[0], result[1] ? result[1].slice() : []];
}

function createConnection(/* config */) {
    const conn = {
        execute: (sql, params) => Promise.resolve().then(() => _runHandler(sql, params)),
        query: (sql, params) => Promise.resolve().then(() => _runHandler(sql, params)),
        beginTransaction: () => Promise.resolve(),
        commit: () => Promise.resolve(),
        rollback: () => Promise.resolve(),
        release: () => {}, // noop for single connection
        end: () => Promise.resolve(),
    };
    return conn;
}

function createPool(/* config */) {
    const pool = {
        execute: (sql, params) => Promise.resolve().then(() => _runHandler(sql, params)),
        query: (sql, params) => Promise.resolve().then(() => _runHandler(sql, params)),
        getConnection: () =>
            Promise.resolve({
                execute: (sql, params) => Promise.resolve().then(() => _runHandler(sql, params)),
                query: (sql, params) => Promise.resolve().then(() => _runHandler(sql, params)),
                beginTransaction: () => Promise.resolve(),
                commit: () => Promise.resolve(),
                rollback: () => Promise.resolve(),
                release: () => {},
            }),
        end: () => Promise.resolve(),
    };
    return pool;
}

/* Helper registration functions for tests */

// Set a handler that returns a successful result for queries matching matcher
function __setQueryResult(matcher, result) {
    // result should be [rows, fields] or rows (rows -> [rows, []])
    handlers.push({
        matcher,
        fn: (sql, params) => (Array.isArray(result) ? result : [result, []]),
    });
}

// Set a handler that throws/rejects for matching queries
function __setQueryError(matcher, error) {
    handlers.push({
        matcher,
        fn: () => {
            throw error instanceof Error ? error : new Error(error);
        },
    });
}

// Set async handler function directly (advanced)
function __setQueryHandler(matcher, fn) {
    handlers.push({ matcher, fn });
}

function __setDefaultResult(result) {
    defaultResult = Array.isArray(result) ? result : [result, []];
}

function __getExecutedQueries() {
    return executedQueries.slice();
}

function __resetMocks() {
    executedQueries.length = 0;
    handlers.length = 0;
    defaultResult = [[], []];
}

module.exports = {
    createPool,
    createConnection,

    // Test helpers
    __setQueryResult,
    __setQueryError,
    __setQueryHandler,
    __setDefaultResult,
    __getExecutedQueries,
    __resetMocks,
};