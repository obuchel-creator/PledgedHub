/**
 * Small pagination utilities for the frontend.
 * Exports two functions:
 *  - paginate(items, page = 1, perPage = 10)
 *  - parsePaginationQuery(query, defaults = { page: 1, perPage: 10 })
 */

/**
 * Safely convert a value to an integer. Falls back to `fallback` when conversion fails.
 * Uses Math.floor for positive/negative floats.
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function toInt(value, fallback) {
  const n = Number(value);
  if (!isFinite(n)) return fallback;
  return Math.floor(n);
}

/**
 * Parse a query-like object into pagination parameters.
 * Accepts plain objects (e.g. { page: '2' }) or URLSearchParams (has .get()).
 *
 * @param {Object|URLSearchParams} query - Source of pagination values.
 * @param {{page:number,perPage:number}} defaults - Default values when parsing fails.
 * @returns {{ page: number, perPage: number, offset: number, limit: number }}
 */
export function parsePaginationQuery(query, defaults = { page: 1, perPage: 10 }) {
  const get = (key) => {
    if (query && typeof query.get === 'function') return query.get(key);
    if (query && Object.prototype.hasOwnProperty.call(query, key)) return query[key];
    return undefined;
  };

  const rawPage = get('page');
  const rawPerPage = get('perPage') ?? get('per_page') ?? get('limit');

  let page = toInt(rawPage, defaults.page);
  let perPage = toInt(rawPerPage, defaults.perPage);

  if (page < 1) page = 1;
  if (perPage <= 0) perPage = defaults.perPage > 0 ? defaults.perPage : 1;

  const offset = (page - 1) * perPage;
  const limit = perPage;

  return { page, perPage, offset, limit };
}

/**
 * Paginate an array synchronously.
 *
 * @param {Array} items - Array of items to paginate.
 * @param {number} [page=1] - Page number (1-based).
 * @param {number} [perPage=10] - Items per page.
 * @returns {{ data: Array, total: number, page: number, perPage: number, totalPages: number }}
 */
export function paginate(items, page = 1, perPage = 10) {
  const arr = Array.isArray(items) ? items : [];
  let p = toInt(page, 1);
  let pp = toInt(perPage, 10);

  if (p < 1) p = 1;
  if (pp <= 0) pp = 1;

  const total = arr.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pp);
  const start = (p - 1) * pp;
  const end = start + pp;
  const data = arr.slice(start, end);

  return {
    data,
    total,
    page: p,
    perPage: pp,
    totalPages,
  };
}
