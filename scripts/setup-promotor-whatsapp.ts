/**
 * Script para verificar y crear promotor "WhatsApp" por defecto
 * Ejecutar cuando ya existan negocios en la base de datos
 * 
 * Uso: npx tsx scripts/setup-promotor-whatsapp.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Configurando promotor "WhatsApp" por defecto...\n');

  // Obtener todos los negocios
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  if (businesses.length === 0) {
    console.log('⚠️  No se encontraron negocios en la base de datos.');
    console.log('   Primero debes crear un negocio antes de agregar promotores.\n');
    return;
  }

  console.log(`📊 Encontrados ${businesses.length} negocio(s):\n`);

  for (const business of businesses) {
    console.log(`🏢 Procesando: ${business.name}`);

    // Verificar si ya existe el promotor "WhatsApp"
    const existingWhatsApp = await prisma.promotor.findFirst({
      where: {
        businessId: business.id,
        nombre: 'WhatsApp',
      },
    });

    if (existingWhatsApp) {
      console.log(`   ✅ Promotor "WhatsApp" ya existe (ID: ${existingWhatsApp.id})`);
    } else {
      // Crear promotor "WhatsApp"
      const whatsappPromotor = await prisma.promotor.create({
        data: {
          businessId: business.id,
          nombre: 'WhatsApp',
          activo: true,
        },
      });
      console.log(`   ✨ Promotor "WhatsApp" creado exitosamente (ID: ${whatsappPromotor.id})`);
    }

    console.log('');
  }

  console.log('✅ Configuración completada!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
