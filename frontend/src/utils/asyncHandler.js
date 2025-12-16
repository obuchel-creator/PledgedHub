/**
 * Lightweight helper to wrap async functions used in event handlers or effects.
 *
 * Usage examples:
 *
 * import { asyncHandler } from './utils/asyncHandler';
 *
 * // In a React onClick
 * const handleClick = asyncHandler(async (e) => {
 *   await doSomething();
 * });
 *
 * // In useEffect (immediately-invoked)
 * useEffect(() => {
 *   asyncHandler(async () => {
 *     await fetchData();
 *   })();
 * }, []);
 */

export function asyncHandler(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('asyncHandler expects a function');
  }

  return (...args) => {
    // Wrap call in Promise.resolve to catch synchronous throws and promise rejections
    return Promise.resolve()
      .then(() => fn(...args))
      .catch((err) => {
        console.error(err);
        // Optional: invoke a UI error handler here, e.g. show toast or set error state
      });
  };
}
