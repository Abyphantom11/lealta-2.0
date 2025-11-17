const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigarDanielas() {
  try {
    console.log('🔍 Investigando todas las "Daniela" en el sistema...\n');
    
    // Buscar todos los clientes con nombre que contenga "Daniela"
    const danielas = await prisma.cliente.findMany({
      where: {
        nombre: {
          contains: 'Daniela',
          mode: 'insensitive'
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    console.log(`📊 Total de clientes "Daniela" encontrados: ${danielas.length}\n`);
    
    for (const cliente of danielas) {
      console.log(`\n--- ${cliente.nombre} ---`);
      console.log(`ID: ${cliente.id}`);
      console.log(`Cédula: ${cliente.cedula}`);
      
      // Contar reservas
      const reservasCount = await prisma.reservation.count({
        where: {
          clienteId: cliente.id,
          status: {
            in: ['CHECKED_IN', 'COMPLETED', 'CONFIRMED']
          }
        }
      });
      
      // Obtener suma de invitados
      const reservas = await prisma.reservation.findMany({
        where: {
          clienteId: cliente.id,
          status: {
            in: ['CHECKED_IN', 'COMPLETED', 'CONFIRMED']
          }
        },
        include: {
          HostTracking: {
            select: {
              guestCount: true
            }
          }
        }
      });
      
      let totalInvitados = 0;
      for (const reserva of reservas) {
        const invitados = (reserva.HostTracking?.guestCount && reserva.HostTracking.guestCount > 0)
          ? reserva.HostTracking.guestCount 
          : reserva.guestCount;
        totalInvitados += invitados;
      }
      
      console.log(`Reservas contadas: ${reservasCount}`);
      console.log(`Total invitados: ${totalInvitados}`);
    }
    
    // Ahora buscar específicamente "Daniela Paredes" con cédula 1721089876
    console.log('\n\n=== VERIFICACIÓN ESPECÍFICA: Daniela Paredes (1721089876) ===\n');
    
    const danielaParedes = await prisma.cliente.findFirst({
      where: {
        cedula: '1721089876'
      }
    });
    
    if (danielaParedes) {
      console.log(`✅ Cliente encontrado: ${danielaParedes.nombre}`);
      console.log(`   ID: ${danielaParedes.id}`);
      
      const reservasParedes = await prisma.reservation.findMany({
        where: {
          clienteId: danielaParedes.id,
          status: {
            in: ['CHECKED_IN', 'COMPLETED', 'CONFIRMED']
          }
        },
        include: {
          HostTracking: {
            select: {
              guestCount: true
            }
          }
        },
        orderBy: {
          reservedAt: 'desc'
        }
      });
      
      console.log(`\n📋 Reservas de Daniela Paredes (${reservasParedes.length}):`);
      
      let total = 0;
      for (const reserva of reservasParedes) {
        const invitados = (reserva.HostTracking?.guestCount && reserva.HostTracking.guestCount > 0)
          ? reserva.HostTracking.guestCount 
          : reserva.guestCount;
        total += invitados;
        console.log(`  ${reserva.reservationNumber}: ${invitados} invitados (${reserva.status})`);
      }
      
      console.log(`\n🎯 TOTAL CALCULADO: ${total} invitados`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

investigarDanielas();
