import { getViteEnv } from './getViteEnv';

const env = getViteEnv();
const DEBUG_UI = String(env.DEBUG_UI || '').toLowerCase() === 'true';

export function uiDebug(...args) {
  if (DEBUG_UI) {
    console.log(...args);
  }
}

export function uiWarn(...args) {
  if (DEBUG_UI) {
    console.warn(...args);
  }
}
