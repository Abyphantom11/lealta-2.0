import { prisma } from '../src/lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Create default location
  const location = await prisma.location.upsert({
    where: { id: 'default-location' },
    update: {},
    create: {
      id: 'default-location',
      name: 'Lealta Bar & Restaurant',
    },
  });

  console.log('📍 Location created:', location.name);

  // Create SUPERADMIN user
  const passwordHash = await hash('admin123', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@lealta.com' },
    update: {},
    create: {
      email: 'admin@lealta.com',
      passwordHash,
      name: 'Super Administrator',
      role: 'SUPERADMIN',
    },
  });

  console.log('👤 SUPERADMIN created:', superAdmin.email);

  // Create a sample staff user
  const staffPasswordHash = await hash('staff123', 12);
  
  const staff = await prisma.user.upsert({
    where: { email: 'staff@lealta.com' },
    update: {},
    create: {
      email: 'staff@lealta.com',
      passwordHash: staffPasswordHash,
      name: 'Staff Member',
      role: 'STAFF',
    },
  });

  console.log('👥 STAFF created:', staff.email);

  console.log('✅ Seeding completed!');
  console.log('\n🔑 Login credentials:');
  console.log('SUPERADMIN: admin@lealta.com / admin123');
  console.log('STAFF: staff@lealta.com / staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
