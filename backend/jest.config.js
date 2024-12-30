module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/index.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/*.types.ts',
    '!**/prisma/**',
    '!**/migrations/**',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage/unit',
  coverageReporters: ['text', 'html', 'lcov', 'json'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
}; 