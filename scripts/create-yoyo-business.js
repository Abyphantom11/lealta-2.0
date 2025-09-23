const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createYoyoBusiness() {
  try {
    console.log('🏢 Creando business "yoyo"...\n');

    // 1. Crear el business
    const business = await prisma.business.create({
      data: {
        name: 'yoyo',
        slug: 'yoyo',
        subdomain: 'yoyo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ Business creado:', business);

    // 2. Crear un usuario admin para este business
    const adminUser = await prisma.user.create({
      data: {
        email: 'yoyo@gmail.com',
        name: 'yoyo',
        businessId: business.id,
        role: 'ADMIN',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ Usuario admin creado:', adminUser);

    // 3. Crear configuración de branding básica
    const branding = await prisma.branding.create({
      data: {
        businessId: business.id,
        businessName: 'yoyo',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        logoUrl: null,
        bannerUrl: null,
        carouselImages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ Branding creado:', branding);

    console.log('\n🎉 Setup completo para business "yoyo"!');
    console.log(`📱 Portal cliente: /yoyo/cliente`);
    console.log(`🔧 Panel admin: /yoyo/admin`);
    console.log(`👤 Login admin: yoyo@gmail.com`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createYoyoBusiness();