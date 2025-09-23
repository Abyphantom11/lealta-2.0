import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test de variables de entorno críticas
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    };
    
    console.log('🔍 Environment check:', envCheck);
    
    return NextResponse.json({
      status: 'success',
      message: 'Environment variables check',
      environment: envCheck,
      timestamp: new Date().toISOString(),
      host: 'vercel-production'
    });
    
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Environment check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
