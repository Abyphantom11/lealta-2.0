const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Verificando usuarios en la base de datos...\n');
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      businessId: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`📊 Total de usuarios: ${users.length}\n`);

  if (users.length === 0) {
    console.log('⚠️  No hay usuarios en la base de datos\n');
  } else {
    console.table(users.map(u => ({
      email: u.email,
      name: u.name,
      role: u.role,
      businessId: u.businessId.substring(0, 8) + '...',
      isActive: u.isActive ? '✅' : '❌',
    })));
  }

  // Contar por rol
  const roleCount = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📈 Usuarios por rol:');
  Object.entries(roleCount).forEach(([role, count]) => {
    console.log(`  ${role}: ${count}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
