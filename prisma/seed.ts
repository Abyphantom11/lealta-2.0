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
  const adminPassword = await hash('admin123', 12);

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

  console.log('� Staff created:', staff.email);

  console.log('✅ Seeding completed!');
  console.log('\n🔑 Login credentials:');
  console.log('SUPERADMIN: admin@lealta.com / admin123');
  console.log('ADMIN: admin@lealta.com / admin123');
  console.log('STAFF: staff@lealta.com / staff123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
