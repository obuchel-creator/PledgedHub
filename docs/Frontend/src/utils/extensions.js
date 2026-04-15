export function safeRegisterExtension(fn) {
  try {
    return fn();
  } catch (e) {
    console.warn('[EXT]', e);
    return null;
  }
}
