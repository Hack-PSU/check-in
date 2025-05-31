// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // if you have a setup file
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'ts-jest', // Use ts-jest preset
  transformIgnorePatterns: [
    '/node_modules/(?!(@firebase|firebase|other-es-module-package)/)', // Adjust if other packages need transformation
    "\\.pnp\\.[^\\/]+$"
  ]
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
