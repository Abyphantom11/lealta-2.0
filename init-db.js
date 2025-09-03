import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  try {
    console.log('🔧 Inicializando base de datos...');
    
    // Crear business con ID hardcodeado
    const business = await prisma.business.create({
      data: {
        id: 'business_1',
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        subdomain: 'mi-restaurante',
        subscriptionPlan: 'BASIC',
        isActive: true
      }
    });
    
    console.log('✅ Business creado:', business);
    
    // Crear un usuario admin de ejemplo
    const adminUser = await prisma.user.create({
      data: {
        id: 'admin_1',
        businessId: 'business_1',
        email: 'admin@restaurant.com',
        passwordHash: 'hash_placeholder',
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Usuario admin creado:', adminUser);
    
    // Crear algunas categorías de ejemplo
    const categoria1 = await prisma.menuCategory.create({
      data: {
        businessId: 'business_1',
        nombre: 'Bebidas',
        descripcion: 'Todas nuestras bebidas',
        orden: 1,
        activo: true,
        icono: 'coffee'
      }
    });
    
    const categoria2 = await prisma.menuCategory.create({
      data: {
        businessId: 'business_1',
        nombre: 'Platos Principales',
        descripcion: 'Nuestros platos estrella',
        orden: 2,
        activo: true,
        icono: 'utensils'
      }
    });
    
    console.log('✅ Categorías de ejemplo creadas:', [categoria1.nombre, categoria2.nombre]);
    
    console.log('🎉 Base de datos inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();
