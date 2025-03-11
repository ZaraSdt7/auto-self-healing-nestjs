import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest', // For TypeScript and NestJS
  testEnvironment: 'node', // Node.js environment
  rootDir: '.', // Project root
  roots: ['<rootDir>/test'], // Tests in test folder
  moduleFileExtensions: ['ts', 'js', 'json'], // Acceptable extensions
  transform: {
    '^.+\\.ts$': 'ts-jest', // .ts files with ts-jest
    '^.+\\.js$': 'babel-jest', // .js files with babel-jest
  },
  testRegex: '.*\\.spec\\.ts$', // Only test .spec.ts files
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true,
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit|@octokit\/rest|@octokit\/core))/', // Transform @octokit packages
  ],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1', // Map src paths
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'], // Setup file for tests
};

export default config;
