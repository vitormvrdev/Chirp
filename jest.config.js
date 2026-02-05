module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./tests/setup.js'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetModules: true,
    testTimeout: 30000,
    // Run tests sequentially to avoid connection issues
    maxWorkers: 1,
    // Set environment
    testEnvironmentOptions: {
        NODE_ENV: 'test'
    }
};
