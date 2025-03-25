module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.{ts,js}',
      '!src/**/*.d.ts',
      '!src/server.ts'
    ],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    setupFilesAfterEnv: ['./tests/setup.ts'],
    testTimeout: 10000
  };