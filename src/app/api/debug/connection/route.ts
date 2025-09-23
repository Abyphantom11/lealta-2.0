import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test de conexión a base de datos
    console.log('🔍 Testing database connection...');
    
    // Verificar variables de entorno críticas
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV
    };
    
    console.log('📋 Environment variables:', envCheck);
    
    // Test simple de Prisma
    const userCount = await prisma.user.count();
    console.log('✅ Database connected, users count:', userCount);
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      environment: envCheck,
      userCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      status: 'error', 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NODE_ENV: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
