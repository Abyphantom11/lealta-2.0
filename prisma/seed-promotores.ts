/**
 * Script para crear promotores por defecto en la base de datos
 * Ejecutar: npx tsx prisma/seed-promotores.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding promotores por defecto...');

  // Obtener todos los negocios
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`📊 Encontrados ${businesses.length} negocios`);

  for (const business of businesses) {
    console.log(`\n🏢 Procesando negocio: ${business.name} (${business.id})`);

    // Verificar si ya existe el promotor "WhatsApp"
    const existingWhatsApp = await prisma.promotor.findFirst({
      where: {
        businessId: business.id,
        nombre: 'WhatsApp',
      },
    });

    if (existingWhatsApp) {
      console.log(`   ✅ Promotor "WhatsApp" ya existe (${existingWhatsApp.id})`);
    } else {
      // Crear promotor "WhatsApp"
      const whatsappPromotor = await prisma.promotor.create({
        data: {
          businessId: business.id,
          nombre: 'WhatsApp',
          activo: true,
        },
      });
      console.log(`   ✨ Promotor "WhatsApp" creado (${whatsappPromotor.id})`);
    }

    // Crear otros promotores comunes (opcional)
    const promotoresComunes = [
      { nombre: 'Instagram', activo: true },
      { nombre: 'Facebook', activo: true },
      { nombre: 'Presencial', activo: true },
      { nombre: 'Teléfono', activo: true },
    ];

    for (const promotorData of promotoresComunes) {
      const existing = await prisma.promotor.findFirst({
        where: {
          businessId: business.id,
          nombre: promotorData.nombre,
        },
      });

      if (!existing) {
        await prisma.promotor.create({
          data: {
            businessId: business.id,
            ...promotorData,
          },
        });
        console.log(`   ✨ Promotor "${promotorData.nombre}" creado`);
      } else {
        console.log(`   ✅ Promotor "${promotorData.nombre}" ya existe`);
      }
    }
  }

  console.log('\n✅ Seed completado exitosamente!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
