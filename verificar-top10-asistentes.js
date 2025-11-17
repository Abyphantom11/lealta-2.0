const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarTop10() {
  const now = new Date();
  const fechaInicio = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const fechaFin = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  
  console.log('🔍 Verificando Top 10 por Asistentes\n');
  
  const reservas = await prisma.reservation.findMany({
    where: { reservedAt: { gte: fechaInicio, lt: fechaFin } },
    include: { Cliente: true, HostTracking: true },
    orderBy: { reservedAt: 'desc' }
  });
  
  const clientesMap = new Map();
  
  for (const r of reservas) {
    if (r.Cliente && r.status === 'CHECKED_IN' && r.HostTracking?.guestCount > 0) {
      const id = r.Cliente.id;
      if (!clientesMap.has(id)) {
        clientesMap.set(id, { 
          nombre: r.Cliente.nombre, 
          asistentes: 0, 
          reservas: 0 
        });
      }
      const c = clientesMap.get(id);
      c.asistentes += r.HostTracking.guestCount;
      c.reservas++;
    }
  }
  
  const top = Array.from(clientesMap.values())
    .sort((a, b) => b.asistentes - a.asistentes)
    .slice(0, 10);
  
  console.log('Top 10 por TOTAL ASISTENTES:');
  top.forEach((c, i) => {
    console.log(`${i+1}. ${c.nombre}: ${c.asistentes} asistentes, ${c.reservas} reservas`);
  });
  
  await prisma.$disconnect();
}

verificarTop10();
