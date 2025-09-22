import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

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

  // Create default location
  const location = await prisma.location.upsert({
    where: { id: 'default-location' },
    update: {},
    create: {
      id: 'default-location',
      businessId: demoBusiness.id,
      name: 'Lealta Bar & Restaurant',
    },
  });

  console.log('📍 Location created:', location.name);

  // Create SUPERADMIN user
  const superAdminPassword = await hash('admin123', 12);

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

  console.log('👑 SuperAdmin created:', superAdmin.email);

  // Create ADMIN user
  const adminPassword = await hash('manager123', 12);

  const admin = await prisma.user.upsert({
    where: {
      businessId_email: {
        businessId: demoBusiness.id,
        email: 'manager@lealta.com',
      },
    },
    update: {},
    create: {
      businessId: demoBusiness.id,
      email: 'manager@lealta.com',
      passwordHash: adminPassword,
      name: 'Restaurant Manager',
      role: 'ADMIN',
      createdBy: superAdmin.id,
      isActive: true,
    },
  });

  console.log('🔧 Admin created:', admin.email);

  // Create STAFF user
  const staffPassword = await hash('staff123', 12);

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
      name: 'Restaurant Staff',
      role: 'STAFF',
      createdBy: admin.id,
      isActive: true,
    },
  });

  console.log('👥 Staff created:', staff.email);

  // Create demo clients
  const clientes = await Promise.all([
    prisma.cliente.upsert({
      where: {
        businessId_cedula: {
          businessId: demoBusiness.id,
          cedula: '12345678'
        }
      },
      update: {},
      create: {
        businessId: demoBusiness.id,
        cedula: '12345678',
        nombre: 'Juan Pérez',
        correo: 'juan@demo.com',
        telefono: '555-0001',
        puntos: 250,
        totalVisitas: 5,
        totalGastado: 125.5,
      },
    }),
    prisma.cliente.upsert({
      where: {
        businessId_cedula: {
          businessId: demoBusiness.id,
          cedula: '87654321'
        }
      },
      update: {},
      create: {
        businessId: demoBusiness.id,
        cedula: '87654321',
        nombre: 'María García',
        correo: 'maria@demo.com',
        telefono: '555-0002',
        puntos: 180,
        totalVisitas: 3,
        totalGastado: 89.75,
      },
    }),
  ]);

  console.log(`👥 ${clientes.length} clientes created`);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('🏆 SuperAdmin: admin@lealta.com / admin123');
  console.log('👨‍💼 Admin: manager@lealta.com / manager123');
  console.log('👩‍💻 Staff: staff@lealta.com / staff123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
