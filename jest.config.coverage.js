const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // COVERAGE CONFIGURATION - Más específica
  collectCoverage: true,
  collectCoverageFrom: [
    // Solo incluir archivos críticos para coverage
    'src/lib/validations.ts',
    'src/utils/business-validation.ts',
    'src/middleware/requireAuth.ts',
    'src/lib/auth/unified-middleware.ts',
    'src/app/api/auth/**/*.ts',
    'src/app/api/admin/**/*.ts',
    'src/components/**/*.{js,ts,jsx,tsx}',
    
    // Excluir archivos que no necesitan coverage
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,ts,jsx,tsx}',
    '!src/**/*.test.{js,ts,jsx,tsx}',
    '!src/**/__tests__/**',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
    '!**/node_modules/**',
  ],
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  coverageDirectory: 'coverage',
  
  // Umbrales más realistas para un proyecto en desarrollo
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    },
    // Umbrales específicos para archivos críticos
    './src/lib/validations.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts,tsx}'
  ],
  
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
}

module.exports = createJestConfig(customJestConfig)
