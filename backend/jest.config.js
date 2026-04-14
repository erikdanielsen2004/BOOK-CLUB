module.exports = {
  testEnvironment: 'node',
  // Sets all process.env vars before any module is loaded
  setupFiles: ['<rootDir>/tests/helpers/envSetup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  // MongoMemoryReplSet can be slow to spin up
  testTimeout: 30000,
  // Ensure Jest exits cleanly after all async work
  forceExit: true
};
