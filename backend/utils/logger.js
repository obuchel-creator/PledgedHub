/**
 * Logger Utility
 * Provides structured logging for development and production
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
};

const LOG_COLORS = {
  ERROR: '\x1b[31m',    // Red
  WARN: '\x1b[33m',     // Yellow
  INFO: '\x1b[36m',     // Cyan
  DEBUG: '\x1b[35m',    // Magenta
  TRACE: '\x1b[37m',    // White
  RESET: '\x1b[0m'
};

const isDevelopment = process.env.NODE_ENV !== 'production';
const minLogLevel = process.env.LOG_LEVEL || (isDevelopment ? 'DEBUG' : 'INFO');

const levelPriority = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4
};

const shouldLog = (level) => levelPriority[level] >= levelPriority[minLogLevel];

const formatTimestamp = () => new Date().toISOString();

const formatMessage = (level, message, data) => {
  const timestamp = formatTimestamp();
  const color = isDevelopment ? LOG_COLORS[level] : '';
  const reset = isDevelopment ? LOG_COLORS.RESET : '';
  
  let output = `${timestamp} [${color}${level}${reset}]`;
  
  if (typeof message === 'string') {
    output += ` ${message}`;
  }
  
  if (data) {
    if (typeof data === 'object') {
      output += ` ${JSON.stringify(data, null, 2)}`;
    } else {
      output += ` ${data}`;
    }
  }
  
  return output;
};

const logger = {
  error: (message, data) => {
    if (shouldLog('ERROR')) {
      console.error(formatMessage('ERROR', message, data));
    }
  },

  warn: (message, data) => {
    if (shouldLog('WARN')) {
      console.warn(formatMessage('WARN', message, data));
    }
  },

  info: (message, data) => {
    if (shouldLog('INFO')) {
      console.info(formatMessage('INFO', message, data));
    }
  },

  debug: (message, data) => {
    if (shouldLog('DEBUG')) {
      console.log(formatMessage('DEBUG', message, data));
    }
  },

  trace: (message, data) => {
    if (shouldLog('TRACE')) {
      console.log(formatMessage('TRACE', message, data));
    }
  },

  http: (method, url, statusCode, duration) => {
    if (shouldLog('DEBUG')) {
      const statusColor = statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
      const msg = `${method.padEnd(6)} ${url} ${statusColor}${statusCode}\x1b[0m ${duration}ms`;
      console.log(formatMessage('INFO', msg));
    }
  }
};

module.exports = logger;
