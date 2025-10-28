/**
 * 🔍 SCRIPT: Investigar Problema de Timezone en Base de Datos
 * 
 * Verifica qué está almacenado en la BD vs lo que se muestra
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigarTimezone() {
  console.log('🔍 INVESTIGANDO PROBLEMA DE TIMEZONE EN BD...\n');
  
  try {
    // Buscar las reservas más recientes
    const reservasRecientes = await prisma.reservation.findMany({
      where: {
        businessId: 'golombiao'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        reservationNumber: true,
        customerName: true,
        reservedAt: true,
        createdAt: true,
        status: true,
        guestCount: true
      }
    });
    
    console.log('📋 RESERVAS RECIENTES:');
    reservasRecientes.forEach((reserva, index) => {
      console.log(`\n${index + 1}. ${reserva.customerName} (${reserva.reservationNumber})`);
      console.log(`   reservedAt (UTC): ${reserva.reservedAt.toISOString()}`);
      console.log(`   reservedAt (Colombia): ${reserva.reservedAt.toLocaleString('es-CO', { 
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`);
      console.log(`   createdAt (UTC): ${reserva.createdAt.toISOString()}`);
      console.log(`   createdAt (Colombia): ${reserva.createdAt.toLocaleString('es-CO', { 
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })}`);
      console.log(`   Status: ${reserva.status}`);
    });
    
    // Verificar si hay reservas con fecha/hora específica
    console.log('\n🎯 BUSCANDO RESERVAS DE HOY...');
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`   Fecha de hoy (para búsqueda): ${hoy}`);
    
    const reservasHoy = await prisma.reservation.findMany({
      where: {
        businessId: 'golombiao',
        reservedAt: {
          gte: new Date(`${hoy}T00:00:00.000Z`),
          lt: new Date(`${hoy}T23:59:59.999Z`)
        }
      },
      select: {
        id: true,
        customerName: true,
        reservedAt: true,
        status: true
      }
    });
    
    console.log(`\n📊 ENCONTRADAS ${reservasHoy.length} RESERVAS PARA HOY`);
    reservasHoy.forEach((reserva, index) => {
      const horaColombiana = reserva.reservedAt.toLocaleString('es-CO', { 
        timeZone: 'America/Guayaquil',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      console.log(`   ${index + 1}. ${reserva.customerName} - ${horaColombiana}`);
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Función para probar una reserva específica
async function probarReservaEspecifica() {
  console.log('\n🧪 SIMULANDO CREACIÓN DE RESERVA CON HORA 01:00...');
  
  const { calcularFechasReserva } = require('./src/lib/timezone-utils.js');
  
  const fecha = '2025-10-27';
  const hora = '01:00';
  
  console.log(`Input: ${fecha} ${hora}`);
  
  const fechasCalculadas = calcularFechasReserva(fecha, hora);
  
  console.log('Resultado calcularFechasReserva:');
  console.log(`   fechaReserva (UTC): ${fechasCalculadas.fechaReserva.toISOString()}`);
  console.log(`   fechaReserva (Colombia): ${fechasCalculadas.fechaReserva.toLocaleString('es-CO', { 
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })}`);
  
  console.log('\n💡 ANÁLISIS:');
  console.log('   - Si el usuario ingresa 01:00, debería almacenarse como 06:00 UTC');
  console.log('   - Al mostrar, debería convertirse de vuelta a 01:00 Colombia');
  console.log('   - El problema puede estar en cómo se extrae la hora para mostrar');
}

investigarTimezone().then(() => {
  return probarReservaEspecifica();
});
