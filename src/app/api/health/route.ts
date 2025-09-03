import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    memory: {
      usage: number;
      free: number;
      total: number;
    };
    disk?: {
      usage: number;
      free: number;
      total: number;
    };
  };
}

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: {
        status: 'down',
      },
      memory: {
        usage: 0,
        free: 0,
        total: 0,
      },
    },
  };

  try {
    // Check database connectivity
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;
    
    healthStatus.checks.database = {
      status: 'up',
      responseTime: dbResponseTime,
    };
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.checks.database = {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }

  // Check memory usage
  try {
    const memUsage = process.memoryUsage();
    healthStatus.checks.memory = {
      usage: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100, // MB
      free: Math.round(((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024) * 100) / 100, // MB
      total: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100, // MB
    };

    // Mark as degraded if memory usage is too high (>80% of heap)
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      healthStatus.status = 'degraded';
    }
  } catch {
    healthStatus.status = 'degraded';
  }

  // If database is down, mark as unhealthy
  if (healthStatus.checks.database.status === 'down') {
    healthStatus.status = 'unhealthy';
  }

  // Determine HTTP status code based on health
  let statusCode = 200;
  if (healthStatus.status === 'unhealthy') {
    statusCode = 503; // Service unavailable
  }

  const responseTime = Date.now() - startTime;

  return NextResponse.json(
    {
      ...healthStatus,
      responseTime,
    },
    { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}

// Also support HEAD requests for simple health checks
export async function HEAD(): Promise<NextResponse> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
