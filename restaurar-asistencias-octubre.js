const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Script para actualizar TODAS las reservas de octubre con el estado correcto
// Lógica:
// - guestCount > 0 → CHECKED_IN (activa)
// - guestCount = 0 → NO_SHOW (caída)

async function actualizarEstadosOctubre() {
  console.log('🔄 Actualizando estados de TODAS las reservas de octubre para Love Me Sky...\n');
  
  // Primero buscar el negocio Love Me Sky
  const business = await prisma.business.findFirst({
    where: {
      name: {
        contains: 'Love Me',
        mode: 'insensitive'
      }
    }
  });

  if (!business) {
    console.log('❌ No se encontró el negocio Love Me Sky');
    return;
  }

  console.log(`✅ Negocio encontrado: ${business.name} (${business.id})\n`);
  
  // Definir rango de fechas para octubre 2025
  const inicioOctubre = new Date('2025-10-01T00:00:00Z');
  const finOctubre = new Date('2025-10-31T23:59:59Z');

  console.log(`📅 Buscando reservas entre ${inicioOctubre.toISOString()} y ${finOctubre.toISOString()}\n`);

  // Obtener todas las reservas de octubre
  const reservasOctubre = await prisma.reservation.findMany({
    where: {
      businessId: business.id,
      reservedAt: {
        gte: inicioOctubre,
        lte: finOctubre
      }
    },
    orderBy: {
      reservedAt: 'asc'
    }
  });

  console.log(`📊 Total de reservas encontradas en octubre: ${reservasOctubre.length}\n`);

  let actualizadas = 0;
  let conAsistencia = 0;
  let sinAsistencia = 0;
  let errores = 0;

  for (const reserva of reservasOctubre) {
    try {
      const guestCount = reserva.guestCount || 0;
      
      // Determinar el nuevo estado basado en guestCount
      let nuevoEstado;
      let shouldSetTimestamps = false;
      
      if (guestCount > 0) {
        nuevoEstado = 'CHECKED_IN'; // Activa
        shouldSetTimestamps = true;
        conAsistencia++;
      } else {
        nuevoEstado = 'NO_SHOW'; // Caída
        sinAsistencia++;
      }

      // Actualizar la reserva
      const updateData = {
        status: nuevoEstado
      };

      // Si hay asistencia, establecer timestamps
      if (shouldSetTimestamps) {
        const timestamp = reserva.checkedInAt || reserva.reservedAt || new Date();
        updateData.checkedInAt = timestamp;
      }

      await prisma.reservation.update({
        where: { id: reserva.id },
        data: updateData
      });

      actualizadas++;
      
      if (actualizadas % 50 === 0) {
        console.log(`✅ Procesadas ${actualizadas} reservas...`);
      }

    } catch (error) {
      console.error(`❌ Error al actualizar reserva ${reserva.id}: ${error.message}`);
      errores++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE ACTUALIZACIÓN');
  console.log('='.repeat(60));
  console.log(`Total de reservas en octubre: ${reservasOctubre.length}`);
  console.log(`✅ Actualizadas correctamente: ${actualizadas}`);
  console.log(`👥 Con asistencia (CHECKED_IN): ${conAsistencia}`);
  console.log(`❌ Sin asistencia (NO_SHOW): ${sinAsistencia}`);
  if (errores > 0) {
    console.log(`⚠️  Errores: ${errores}`);
  }
  console.log('='.repeat(60));
}

actualizarEstadosOctubre()
  .then(() => {
    console.log('\n✨ Proceso completado!');
    prisma.$disconnect();
  })
  .catch((error) => {
    console.error('❌ Error general:', error);
    prisma.$disconnect();
    process.exit(1);
  });
