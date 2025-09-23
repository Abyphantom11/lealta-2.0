import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
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
    const businessCount = await prisma.business.count();
    const demoUser = await prisma.user.findFirst({ where: { email: 'arepa@gmail.com' } });
    
    console.log('✅ Database connected');
    console.log('- Users count:', userCount);
    console.log('- Business count:', businessCount);
    console.log('- Demo user exists:', !!demoUser);
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      environment: envCheck,
      userCount,
      businessCount,
      demoUserExists: !!demoUser,
      demoUser: demoUser ? { 
        id: demoUser.id, 
        email: demoUser.email, 
        role: demoUser.role,
        businessId: demoUser.businessId 
      } : null,
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
