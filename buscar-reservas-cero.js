const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Estas son las reservas que según los datos restaurados tenían 0 asistencias reales
const reservasCero = [
  'Jose Albarado',
  'Emiliano Viteri',
  'Fabricio Mejía',
  'Soledad Pérez',
  'Nicole Luna',
  'Juan Ortiz',
  'Pablo Castillo',
  'Michelle Lozano',
  'Andrea Córdova',
  'Juanse Guerrero'
];

async function buscar() {
  console.log('🔍 Buscando reservas que deberían tener 0 asistencias...\n');
  
  for (const nombre of reservasCero) {
    const reserva = await prisma.reservation.findFirst({
      where: {
        customerName: {
          contains: nombre,
          mode: 'insensitive'
        },
        reservedAt: {
          gte: new Date('2025-10-01'),
          lte: new Date('2025-10-31T23:59:59')
        }
      }
    });
    
    if (reserva) {
      console.log(`${nombre}: guestCount=${reserva.guestCount}, status=${reserva.status}`);
    } else {
      console.log(`${nombre}: NO ENCONTRADA`);
    }
  }
  
  await prisma.$disconnect();
}

buscar();
