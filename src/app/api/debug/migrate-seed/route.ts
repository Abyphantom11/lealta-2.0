import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🚀 Starting database migration and seeding...');
    
    // Verificar si las tablas ya existen
    let tablesExist = false;
    try {
      await prisma.user.count();
      tablesExist = true;
      console.log('✅ Tables already exist');
    } catch {
      console.log('📋 Tables do not exist, need to create them');
    }
    
    if (!tablesExist) {
      // Las tablas no existen, necesitamos crear el schema
      console.log('⚠️  Database schema missing. You need to run migrations manually.');
      
      return NextResponse.json({
        status: 'error',
        message: 'Database schema missing',
        instructions: [
          '1. Connect to your database directly',
          '2. Run: npx prisma db push --accept-data-loss',
          '3. Or use Prisma migrate deploy',
          '4. Then run this endpoint again to seed data'
        ],
        prismaCommands: [
          'npx prisma generate',
          'npx prisma db push --accept-data-loss'
        ]
      }, { status: 400 });
    }
    
    // Si llegamos aquí, las tablas existen, podemos seed
    console.log('🌱 Seeding database with initial data...');
    
    // Verificar si ya hay un business
    const businessCount = await prisma.business.count();
    let business;
    
    if (businessCount === 0) {
      // Crear business demo
      business = await prisma.business.create({
        data: {
          name: 'Lealta Demo',
          slug: 'demo',
          subdomain: 'demo',
          subscriptionPlan: 'PRO',
          isActive: true,
          settings: {
            contactEmail: 'demo@lealta.app'
          }
        }
      });
      console.log('✅ Demo business created');
    } else {
      business = await prisma.business.findFirst();
      console.log('✅ Using existing business');
    }
    
    // Verificar si ya hay usuarios
    const userCount = await prisma.user.count();
    let user;
    
    if (userCount === 0) {
      // Crear usuario admin usando bcryptjs
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash('123456', 12);
      
      user = await prisma.user.create({
        data: {
          email: 'arepa@gmail.com',
          passwordHash,
          name: 'Administrador Demo',
          role: 'SUPERADMIN',
          businessId: business!.id,
          isActive: true
        }
      });
      console.log('✅ Demo user created');
    } else {
      user = await prisma.user.findFirst({ where: { email: 'arepa@gmail.com' } });
      console.log('✅ Demo user already exists');
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database seeded successfully',
      data: {
        businessCount: await prisma.business.count(),
        userCount: await prisma.user.count(),
        demoUser: {
          email: 'arepa@gmail.com',
          password: '123456',
          role: user?.role
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Migration/Seed error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Migration/Seed failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
