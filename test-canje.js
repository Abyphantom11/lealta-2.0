const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCanje() {
  try {
    // Ver puntos antes del canje
    const clienteBefore = await prisma.cliente.findFirst({
      where: { nombre: 'abrahan' },
      select: { id: true, nombre: true, puntos: true }
    });
    
    console.log('Cliente ANTES del canje:', clienteBefore);

    if (clienteBefore) {
      // Simular canje de 200 puntos
      const response = await fetch('http://localhost:3001/api/admin/canjear-recompensa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId: clienteBefore.id,
          recompensaId: 'test-reward',
          puntosDescontados: 200,
        }),
      });

      const data = await response.json();
      console.log('Respuesta de la API:', data);

      // Ver puntos después del canje
      const clienteAfter = await prisma.cliente.findFirst({
        where: { nombre: 'abrahan' },
        select: { id: true, nombre: true, puntos: true }
      });
      
      console.log('Cliente DESPUÉS del canje:', clienteAfter);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCanje();
