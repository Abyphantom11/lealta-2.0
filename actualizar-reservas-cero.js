const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista de todas las reservas de octubre que tuvieron 0 asistencias reales
// Basado en todos los datos restaurados anteriormente
const reservasSinAsistencia = [
  'Jose Albarado',
  'Emiliano Viteri', 
  'Fabricio Mejía',
  'Soledad Pérez',
  'Nicole Luna',
  'Juan Ortiz',
  'Pablo Castillo',
  'Michelle Lozano',
  'Andrea Córdova',
  'Juanse Guerrero',
  'Camila Leon',
  'Pedro Crespo',
  'Kristhel Zuñiga',
  'Danniel Brito',
  'Esteban Villacrés',
  'Amy Álvarez',
  'Álvaro Jácome',
  'Nicole Lozada',
  'Diego Rojas',
  'Jessica Vásquez',
  'Nicolás Cevallos',
  'Dayana Elizalde',
  'Gabriela Reinoso',
  'Evelin Atiencia',
  'Christian Estrada',
  'Cristian Ochoa'
];

async function actualizarReservasCero() {
  console.log('🔄 Actualizando reservas con 0 asistencias a estado NO_SHOW...\n');
  
  const business = await prisma.business.findFirst({
    where: {
      name: {
        contains: 'Love Me',
        mode: 'insensitive'
      }
    }
  });

  if (!business) {
    console.log('❌ No se encontró el negocio');
    return;
  }

  console.log(`✅ Negocio: ${business.name}\n`);

  let actualizadas = 0;
  let noEncontradas = 0;

  for (const nombre of reservasSinAsistencia) {
    try {
      const reserva = await prisma.reservation.findFirst({
        where: {
          businessId: business.id,
          customerName: {
            contains: nombre.trim(),
            mode: 'insensitive'
          },
          reservedAt: {
            gte: new Date('2025-10-01T00:00:00Z'),
            lte: new Date('2025-10-31T23:59:59Z')
          }
        }
      });

      if (!reserva) {
        console.log(`⚠️  No encontrada: ${nombre}`);
        noEncontradas++;
        continue;
      }

      // Actualizar a guestCount = 0 y status = NO_SHOW
      await prisma.reservation.update({
        where: { id: reserva.id },
        data: {
          guestCount: 0,
          status: 'NO_SHOW'
        }
      });

      console.log(`✅ ${nombre}: guestCount → 0, status → NO_SHOW`);
      actualizadas++;

    } catch (error) {
      console.error(`❌ Error con ${nombre}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`Total a procesar: ${reservasSinAsistencia.length}`);
  console.log(`✅ Actualizadas: ${actualizadas}`);
  console.log(`⚠️  No encontradas: ${noEncontradas}`);
  console.log('='.repeat(60));
}

actualizarReservasCero()
  .then(() => {
    console.log('\n✨ Proceso completado!');
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
