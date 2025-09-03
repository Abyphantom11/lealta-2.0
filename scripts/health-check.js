#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { createServer } = require('http');

const prisma = new PrismaClient();

async function healthCheck() {
  const checks = {
    database: false,
    server: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
    console.log('✅ Database: Connected');
  } catch (error) {
    console.error('❌ Database: Failed to connect', error.message);
  }

  try {
    // Check if server can start
    const server = createServer();
    const port = process.env.PORT || 3002; // Use different port for health check

    await new Promise((resolve, reject) => {
      server.listen(port, () => {
        checks.server = true;
        console.log(`✅ Server: Can bind to port ${port}`);
        server.close(() => resolve());
      });

      server.on('error', error => {
        console.error('❌ Server: Cannot start', error.message);
        reject(new Error('Server check failed'));
      });
    });
  } catch (error) {
    console.error('❌ Server: Failed to check', error.message);
  }

  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'AUTH_SECRET'];

  const missingEnvVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    console.error('❌ Environment: Missing variables:', missingEnvVars);
  } else {
    console.log('✅ Environment: All required variables present');
  }

  await prisma.$disconnect();

  const allHealthy =
    checks.database && checks.server && missingEnvVars.length === 0;

  console.log('\n📊 Health Check Summary:');
  console.log(JSON.stringify(checks, null, 2));

  process.exit(allHealthy ? 0 : 1);
}

healthCheck().catch(error => {
  console.error('Health check failed:', error.message);
  process.exit(1);
});
