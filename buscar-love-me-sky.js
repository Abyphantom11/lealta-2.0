const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buscarLoveMeSky() {
  console.log('🔍 Buscando business "Love Me Sky"...\n');

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  console.log('📊 Todos los businesses:\n');
  for (const b of businesses) {
    console.log(`${b.name}`);
    console.log(`   ID: ${b.id}`);
    console.log('');
  }

  const loveMeSky = businesses.find(b => 
    b.name.toLowerCase().includes('love') || 
    b.name.toLowerCase().includes('sky')
  );

  if (loveMeSky) {
    console.log(`✅ Business encontrado: ${loveMeSky.name}`);
    console.log(`   ID: ${loveMeSky.id}`);
  } else {
    console.log('❌ No se encontró business con "Love" o "Sky" en el nombre');
  }

  await prisma.$disconnect();
}

buscarLoveMeSky().catch(console.error);
