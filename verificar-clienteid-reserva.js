const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarClienteIdReserva() {
  console.log('═══════════════════════════════════════════════════');
  console.log('VERIFICAR: ClienteId de la última reserva CHECKED_IN');
  console.log('═══════════════════════════════════════════════════\n');
  
  try {
    const reserva = await prisma.reservation.findFirst({
      where: { status: 'CHECKED_IN' },
      orderBy: { updatedAt: 'desc' },
      include: {
        Cliente: true
      }
    });
    
    if (!reserva) {
      console.log('❌ No se encontró reserva');
      return;
    }
    
    console.log('📋 RESERVA:');
    console.log('  ID:', reserva.id);
    console.log('  Cliente Name (customerName):', reserva.customerName);
    console.log('  Cliente Phone (customerPhone):', reserva.customerPhone);
    console.log('  Cliente Email (customerEmail):', reserva.customerEmail);
    console.log('  ClienteId (FK):', reserva.clienteId || '❌ NULL');
    console.log('  BusinessId:', reserva.businessId);
    
    if (reserva.Cliente) {
      console.log('\n👤 CLIENTE (relación):');
      console.log('  ID:', reserva.Cliente.id);
      console.log('  Nombre:', reserva.Cliente.nombre);
      console.log('  Teléfono:', reserva.Cliente.telefono);
      console.log('  Correo:', reserva.Cliente.correo);
    } else {
      console.log('\n❌ NO HAY CLIENTE (relación)');
    }
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('ANÁLISIS:');
    console.log('═══════════════════════════════════════════════════\n');
    
    if (!reserva.clienteId) {
      console.log('❌ PROBLEMA: reserva.clienteId es NULL');
      console.log('   Esto impide crear HostTracking porque requiere clienteId');
      console.log('\n🔧 SOLUCIÓN:');
      console.log('   1. Buscar o crear Cliente basado en customerPhone/customerName');
      console.log('   2. Actualizar reserva.clienteId');
      console.log('   3. Crear HostTracking con el clienteId correcto');
      
      // Intentar buscar cliente por teléfono
      if (reserva.customerPhone) {
        const clienteExistente = await prisma.cliente.findFirst({
          where: {
            telefono: reserva.customerPhone,
            businessId: reserva.businessId
          }
        });
        
        if (clienteExistente) {
          console.log('\n✅ CLIENTE ENCONTRADO POR TELÉFONO:');
          console.log('   ID:', clienteExistente.id);
          console.log('   Nombre:', clienteExistente.nombre);
          console.log('\n🔧 ACCIÓN RECOMENDADA:');
          console.log('   Actualizar reservation.clienteId =', clienteExistente.id);
        } else {
          console.log('\n❌ NO SE ENCONTRÓ CLIENTE CON ESE TELÉFONO');
          console.log('\n🔧 ACCIÓN RECOMENDADA:');
          console.log('   1. Crear nuevo Cliente');
          console.log('   2. Actualizar reservation.clienteId');
        }
      }
    } else {
      console.log('✅ Reserva tiene clienteId:', reserva.clienteId);
      console.log('   El problema puede estar en otro lugar');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarClienteIdReserva();
