/**
 * Script para verificar qué businesses existen en la base de datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusinesses() {
  try {
    console.log('🔍 Buscando todos los businesses en la base de datos...\n');
    
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: {
          promotores: true,
          clientes: true,
        },
      },
    },
  });    if (businesses.length === 0) {
      console.log('❌ No hay businesses en la base de datos');
      console.log('\n💡 Necesitas crear un business primero para poder crear promotores');
    } else {
      console.log(`✅ Encontrados ${businesses.length} business(es):\n`);
      
      businesses.forEach((business, index) => {
        console.log(`${index + 1}. ${business.name}`);
        console.log(`   ID: ${business.id}`);
        console.log(`   Slug: ${business.slug}`);
        console.log(`   Promotores: ${business._count.promotores}`);
        console.log(`   Clientes: ${business._count.clientes}`);
        console.log('');
      });

      console.log('💡 Usa uno de estos IDs cuando crees un promotor');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinesses();
