module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 15000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};
