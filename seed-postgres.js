const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PostgreSQL database...');

  try {
    // Crear business demo
    const demoBusiness = await prisma.business.upsert({
      where: { subdomain: 'demo' },
      update: {},
      create: {
        name: 'Demo Restaurant',
        slug: 'demo-restaurant',
        subdomain: 'demo',
        subscriptionPlan: 'PRO',
        isActive: true,
      },
    });

    console.log('✅ Business creado:', demoBusiness.name);

    // Crear location por defecto
    const location = await prisma.location.upsert({
      where: { id: 'default-location' },
      update: {},
      create: {
        id: 'default-location',
        businessId: demoBusiness.id,
        name: 'Lealta Bar & Restaurant',
      },
    });

    console.log('📍 Location creada:', location.name);

    // Crear usuario SUPERADMIN
    const superAdminPassword = await bcrypt.hash('admin123', 12);

    const superAdmin = await prisma.user.upsert({
      where: {
        businessId_email: {
          businessId: demoBusiness.id,
          email: 'admin@lealta.com',
        },
      },
      update: {},
      create: {
        businessId: demoBusiness.id,
        email: 'admin@lealta.com',
        passwordHash: superAdminPassword,
        name: 'Super Administrator',
        role: 'SUPERADMIN',
        isActive: true,
      },
    });

    console.log('👤 Usuario SUPERADMIN creado:', superAdmin.email);

    // Crear usuario STAFF
    const staffPassword = await bcrypt.hash('staff123', 12);

    const staff = await prisma.user.upsert({
      where: {
        businessId_email: {
          businessId: demoBusiness.id,
          email: 'staff@lealta.com',
        },
      },
      update: {},
      create: {
        businessId: demoBusiness.id,
        email: 'staff@lealta.com',
        passwordHash: staffPassword,
        name: 'Staff Member',
        role: 'STAFF',
        isActive: true,
      },
    });

    console.log('👤 Usuario STAFF creado:', staff.email);

    // Crear categorías de menú
    const category1 = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Bebidas',
        descripcion: 'Bebidas y cócteles',
        orden: 1,
        activo: true,
      },
    });

    const category2 = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Comidas',
        descripcion: 'Platos principales',
        orden: 2,
        activo: true,
      },
    });

    console.log('📋 Categorías de menú creadas');

    // Crear cliente de prueba
    const cliente = await prisma.cliente.create({
      data: {
        businessId: demoBusiness.id,
        cedula: '12345678',
        nombre: 'Cliente Demo',
        telefono: '+1-234-567-8901',
        correo: 'cliente@example.com',
        puntosAcumulados: 500,
      },
    });

    console.log('👤 Cliente demo creado:', cliente.nombre);

    console.log('\n� Base de datos seeded exitosamente (versión básica)');
    console.log('\n🎯 Credenciales de acceso:');
    console.log('   SUPERADMIN: admin@lealta.com / admin123');
    console.log('   STAFF: staff@lealta.com / staff123');
    console.log('   CLIENTE: cédula 12345678');

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

module.exports = { main };
