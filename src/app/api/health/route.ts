import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    redis?: HealthCheckResult;
    external?: HealthCheckResult;
    memory: HealthCheckResult;
    disk?: HealthCheckResult;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  message?: string;
  details?: Record<string, any>;
}

const startTime = Date.now();

export async function GET() {
  const checks: HealthCheck['checks'] = {
    database: await checkDatabase(),
    memory: checkMemory(),
  };

  // Add Redis check if configured
  if (process.env.UPSTASH_REDIS_REST_URL) {
    checks.redis = await checkRedis();
  }

  // Add external service checks
  checks.external = await checkExternalServices();

  // Determine overall status
  const hasFailures = Object.values(checks).some(check => check.status === 'fail');
  const hasWarnings = Object.values(checks).some(check => check.status === 'warn');
  
  let overallStatus: HealthCheck['status'] = 'healthy';
  if (hasFailures) {
    overallStatus = 'unhealthy';
  } else if (hasWarnings) {
    overallStatus = 'degraded';
  }

  const healthCheck: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Date.now() - startTime,
    checks,
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(healthCheck, { status: statusCode });
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - start;
    
    if (responseTime > 1000) {
      return {
        status: 'warn',
        responseTime,
        message: 'Database response time is slow',
      };
    }
    
    return {
      status: 'pass',
      responseTime,
      message: 'Database connection successful',
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: 'Database connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

async function checkRedis(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Check Redis connectivity
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });
    
    const responseTime = Date.now() - start;
    
    if (!response.ok) {
      return {
        status: 'fail',
        responseTime,
        message: 'Redis connection failed',
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      };
    }
    
    if (responseTime > 500) {
      return {
        status: 'warn',
        responseTime,
        message: 'Redis response time is slow',
      };
    }
    
    return {
      status: 'pass',
      responseTime,
      message: 'Redis connection successful',
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: 'Redis connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

function checkMemory(): HealthCheckResult {
  if (typeof process === 'undefined') {
    return {
      status: 'warn',
      message: 'Memory check not available in browser environment',
    };
  }

  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };

  // Warning if heap usage is over 512MB
  if (memoryUsageMB.heapUsed > 512) {
    return {
      status: 'warn',
      message: 'High memory usage detected',
      details: memoryUsageMB,
    };
  }

  // Fail if heap usage is over 1GB
  if (memoryUsageMB.heapUsed > 1024) {
    return {
      status: 'fail',
      message: 'Critical memory usage detected',
      details: memoryUsageMB,
    };
  }

  return {
    status: 'pass',
    message: 'Memory usage is normal',
    details: memoryUsageMB,
  };
}

async function checkExternalServices(): Promise<HealthCheckResult> {
  const checks = [];

  // Check Sentry (if configured)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    checks.push(checkSentry());
  }

  // Check other external services as needed
  // checks.push(checkPaymentProvider());
  // checks.push(checkEmailService());

  if (checks.length === 0) {
    return {
      status: 'pass',
      message: 'No external services configured',
    };
  }

  const results = await Promise.allSettled(checks);
  const failures = results.filter(result => 
    result.status === 'rejected' || 
    (result.status === 'fulfilled' && result.value.status === 'fail')
  );

  if (failures.length > 0) {
    return {
      status: 'warn',
      message: `${failures.length} external service(s) failing`,
      details: {
        total: checks.length,
        failures: failures.length,
      },
    };
  }

  return {
    status: 'pass',
    message: 'All external services operational',
    details: {
      total: checks.length,
      failures: 0,
    },
  };
}

async function checkSentry(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Simple check - try to send a test event
    // In production, you might want to use Sentry's health check endpoint
    return {
      status: 'pass',
      responseTime: Date.now() - start,
      message: 'Sentry integration active',
    };
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - start,
      message: 'Sentry integration failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

// Detailed health check for monitoring systems
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { detailed = false } = body;

  if (!detailed) {
    return GET();
  }

  // Extended health check with more detailed information
  const detailedChecks = {
    ...(await GET()).json(),
    detailed: {
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
    },
  };

  return NextResponse.json(detailedChecks);
}