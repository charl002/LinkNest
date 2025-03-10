import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: "node", // Use node environment for API tests
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  moduleNameMapper: {
    // Handle module aliases
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Avoid transforming these packages
  transformIgnorePatterns: [
    "/node_modules/(?!next|socket.io|socket.io-client|engine.io-client|engine.io-parser|socket.io-parser|debug)",
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig)