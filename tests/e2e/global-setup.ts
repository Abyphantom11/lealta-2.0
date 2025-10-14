// Global setup for Playwright tests
// This file ensures TransformStream polyfill is available in all e2e tests

async function globalSetup() {
  // Polyfill para TransformStream en Node.js < 18
  if (typeof TransformStream === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TransformStream } = await import('stream/web');
    (globalThis as any).TransformStream = TransformStream;
  }
  
  console.log('🚀 Global setup completed for e2e tests');
}

export default globalSetup;
