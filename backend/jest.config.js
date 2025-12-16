module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/?(*.)+(spec|test).[jt]s?(x)'],
  verbose: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  moduleNameMapper: {
    '^express-validator$': '<rootDir>/tests/mocks/express-validator.js',
    '^express-validator/(.*)$': '<rootDir>/tests/mocks/express-validator.js',
    '^morgan$': '<rootDir>/tests/mocks/morgan.js'
    // '^mysql2/promise$': '<rootDir>/tests/mocks/mysql2-promise.js',
    // '^mysql2$': '<rootDir>/tests/mocks/mysql2-promise.js'
  },
  setupFiles: ['<rootDir>/tests/jest.setup.js']
};