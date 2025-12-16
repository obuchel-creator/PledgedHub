const express = require('express');
const asyncHandler = require('../utils/asyncHandler');

'use strict';

/**
 * Minimal async route wrapper for Express (CommonJS).
 * Validates input and preserves `this` when invoking the handler.
 *
 * @param {Function} fn - async route handler (req, res, next)
 * @returns {Function} (req, res, next) => Promise.resolve(fn.call(this, req, res, next)).catch(next)
 */
function asyncHandler(fn) {
    if (typeof fn !== 'function') {
        throw new TypeError('asyncHandler expects a function');
    }

    // Return wrapper that forwards errors to next(). `this` is preserved via fn.call(this,...)
    return (req, res, next) => Promise.resolve(fn.call(this, req, res, next)).catch(next);
}

module.exports = asyncHandler;

/*
Usage example:

const router = express.Router();

router.get('/items/:id', asyncHandler(async function (req, res) {
    const item = await getItemById(req.params.id);
    res.json(item);
}));

*/