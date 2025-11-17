const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigarDanielaParedes() {
  try {
    console.log('🔍 Investigando a Daniela Paredes...\n');
    
    // 1. Buscar el cliente
    const cliente = await prisma.cliente.findFirst({
      where: {
        nombre: {
          contains: 'Daniela Paredes',
          mode: 'insensitive'
        }
      }
    });
    
    if (!cliente) {
      console.log('❌ No se encontró cliente Daniela Paredes');
      await prisma.$disconnect();
      return;
    }
    
    console.log('✅ Cliente encontrado:');
    console.log(`   ID: ${cliente.id}`);
    console.log(`   Nombre: ${cliente.nombre}`);
    console.log(`   Cédula: ${cliente.cedula}`);
    console.log('');
    
    // 2. Obtener TODAS sus reservas con detalles
    const reservas = await prisma.reservation.findMany({
      where: {
        clienteId: cliente.id
      },
      include: {
        HostTracking: {
          select: {
            id: true,
            guestCount: true,
            isActive: true,
          }
        }
      },
      orderBy: {
        reservedAt: 'desc'
      }
    });
    
    console.log(`📊 Total de reservas: ${reservas.length}\n`);
    
    let totalInvitadosPlaneados = 0;
    let totalInvitadosReales = 0;
    let reservasContadas = 0;
    
    console.log('--- Detalle de cada reserva ---\n');
    
    reservas.forEach((reserva, index) => {
      console.log(`Reserva ${index + 1}:`);
      console.log(`  Número: ${reserva.reservationNumber}`);
      console.log(`  Estado: ${reserva.status}`);
      console.log(`  Fecha: ${reserva.reservedAt}`);
      console.log(`  guestCount (planeado): ${reserva.guestCount}`);
      console.log(`  HostTracking: ${reserva.HostTracking ? 'Existe' : 'No existe'}`);
      
      if (reserva.HostTracking) {
        console.log(`    - guestCount (real): ${reserva.HostTracking.guestCount}`);
        console.log(`    - isActive: ${reserva.HostTracking.isActive}`);
      }
      
      // Simular la lógica del API
      const seContaria = ['COMPLETED', 'CONFIRMED', 'CHECKED_IN'].includes(reserva.status);
      console.log(`  ¿Se contaría en el API?: ${seContaria ? 'SÍ' : 'NO'}`);
      
      if (seContaria) {
        const invitados = (reserva.HostTracking?.guestCount && reserva.HostTracking.guestCount > 0)
          ? reserva.HostTracking.guestCount 
          : reserva.guestCount;
        
        console.log(`  -> Invitados que se contarían: ${invitados}`);
        totalInvitadosReales += invitados;
        reservasContadas++;
      }
      
      totalInvitadosPlaneados += reserva.guestCount;
      console.log('');
    });
    
    console.log('--- RESUMEN ---');
    console.log(`Total reservas: ${reservas.length}`);
    console.log(`Reservas que se contarían: ${reservasContadas}`);
    console.log(`Total invitados planeados (suma de guestCount): ${totalInvitadosPlaneados}`);
    console.log(`Total invitados que se contarían en el API: ${totalInvitadosReales}`);
    console.log('');
    
    // 3. Verificar por estado
    console.log('--- Distribución por estado ---');
    const porEstado = {};
    reservas.forEach(r => {
      if (!porEstado[r.status]) {
        porEstado[r.status] = { count: 0, invitados: 0 };
      }
      porEstado[r.status].count++;
      porEstado[r.status].invitados += r.guestCount;
    });
    
    Object.entries(porEstado).forEach(([estado, data]) => {
      console.log(`${estado}: ${data.count} reservas, ${data.invitados} invitados planeados`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

investigarDanielaParedes();
