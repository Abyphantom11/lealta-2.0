/* eslint-disable unicorn/prefer-top-level-await */
/**
 * Script para diagnosticar el QR del evento "prueba" en lovememanta
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

void (async function() {
  try {
    console.log('🔍 Buscando evento "prueba" en lovememanta...\n');
    
    // Buscar el business lovememanta
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { name: { contains: 'loveme', mode: 'insensitive' } },
          { name: { contains: 'manta', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!business) {
      console.log('❌ No se encontró el business lovememanta');
      process.exit(1);
    }
    
    console.log(`✅ Business encontrado: ${business.name} (ID: ${business.id})\n`);
    
    // Buscar evento "prueba"
    const evento = await prisma.event.findFirst({
      where: {
        businessId: business.id,
        OR: [
          { name: { contains: 'prueba', mode: 'insensitive' } },
          { slug: { contains: 'prueba', mode: 'insensitive' } }
        ]
      },
      include: {
        EventGuest: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { EventGuest: true }
        }
      }
    });
    
    if (!evento) {
      console.log('❌ No se encontró el evento "prueba"');
      console.log('\n📋 Eventos disponibles:');
      const eventos = await prisma.event.findMany({
        where: { businessId: business.id },
        select: { id: true, name: true, slug: true, status: true }
      });
      console.table(eventos);
      process.exit(1);
    }
    
    console.log('🎉 Evento encontrado:');
    console.log(`   Nombre: ${evento.name}`);
    console.log(`   Slug: ${evento.slug}`);
    console.log(`   Estado: ${evento.status}`);
    console.log(`   URL: /evento/${evento.slug}`);
    console.log(`   Total invitados: ${evento._count.EventGuest}`);
    console.log(`   Capacidad: ${evento.currentCount}/${evento.maxCapacity}\n`);
    
    if (evento.EventGuest.length === 0) {
      console.log('⚠️ No hay invitados registrados aún');
      console.log('\n💡 Para probar el scanner:');
      console.log(`   1. Registra un invitado en: /evento/${evento.slug}`);
      console.log('   2. Descarga el QR generado');
      console.log('   3. Escanéalo con el scanner de reservas');
      process.exit(0);
    }
    
    console.log('👥 Últimos invitados registrados:');
    for (const guest of evento.EventGuest) {
      console.log(`\n   📋 ${guest.name}`);
      console.log(`      Cédula: ${guest.cedula}`);
      console.log(`      QR Token: ${guest.qrToken}`);
      console.log(`      Estado: ${guest.status}`);
      console.log(`      Registrado: ${guest.createdAt.toLocaleString('es-EC')}`);
      
      if (guest.qrData) {
        try {
          const qrData = JSON.parse(guest.qrData);
          console.log(`      QR Data:`, qrData);
        } catch {
          console.log(`      QR Data (raw): ${guest.qrData.substring(0, 100)}...`);
        }
      }
      
      // Verificar que el token se puede detectar
      console.log(`\n   🔍 Verificando detección del token...`);
      const testGuest = await prisma.eventGuest.findUnique({
        where: { qrToken: guest.qrToken }
      });
      
      if (testGuest) {
        console.log(`      ✅ Token detectado correctamente en BD`);
      } else {
        console.log(`      ❌ ERROR: Token NO se puede detectar`);
      }
    }
    
    console.log('\n\n💡 Para escanear un QR:');
    console.log('   1. Ve al módulo de Reservas');
    console.log('   2. Clic en "Scanner QR"');
    console.log('   3. Escanea el QR del invitado');
    console.log('   4. El scanner debería reconocerlo automáticamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
