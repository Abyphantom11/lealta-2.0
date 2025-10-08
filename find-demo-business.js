/**
 * Buscar el negocio demo creado
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findUnique({
    where: { slug: "casa-sabor-demo" },
    include: {
      users: true,
      locations: true,
    }
  });

  if (business) {
    console.log('\n🏢 NEGOCIO DEMO ENCONTRADO:\n');
    console.log(`ID: ${business.id}`);
    console.log(`Nombre: ${business.name}`);
    console.log(`Slug: ${business.slug}`);
    console.log(`Subdomain: ${business.subdomain}\n`);
    
    console.log('👥 USUARIOS:');
    business.users.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    
    console.log('\n📍 UBICACIONES:');
    business.locations.forEach(loc => {
      console.log(`  - ${loc.name} (${loc.id})`);
    });
    
    console.log('\n🚀 ACCESO:\n');
    console.log(`Admin Dashboard:`);
    console.log(`   http://localhost:3001/admin/login`);
    console.log(`   Email: admin@casadelsabor.com`);
    console.log(`   Pass: Demo2024!\n`);
    console.log(`Portal Cliente:`);
    console.log(`   http://localhost:3001/${business.id}\n`);
    console.log(`Staff (POS):`);
    console.log(`   http://localhost:3001/${business.id}/staff\n`);
  } else {
    console.log('❌ No se encontró el negocio demo');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
