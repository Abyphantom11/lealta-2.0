const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renombrar() {
  console.log('Renombrando negocio...\n');
  
  const business = await prisma.business.update({
    where: { id: 'cmgf5px5f0000eyy0elci9yds' },
    data: {
      name: 'Demo Lealta',
      slug: 'demo-lealta',
      subdomain: 'demo-lealta'
    }
  });
  
  console.log('✅ Negocio renombrado exitosamente!\n');
  console.log('Nuevo nombre:', business.name);
  console.log('Nuevo slug:', business.slug);
  console.log('Nuevo subdominio:', business.subdomain + '.lealta.app');
}

renombrar().then(() => prisma.$disconnect());
