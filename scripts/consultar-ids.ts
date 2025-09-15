import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function consultarIds() {
  try {
    console.log('📋 Consultando IDs existentes...');

    const clientes = await prisma.cliente.findMany({
      take: 5,
      select: { id: true, nombre: true }
    });
    console.log('👥 Clientes:', clientes);

    const locations = await prisma.location.findMany({
      take: 5,
      select: { id: true, name: true }
    });
    console.log('📍 Locations:', locations);

    const usuarios = await prisma.user.findMany({
      take: 5,
      select: { id: true, name: true, role: true }
    });
    console.log('👤 Usuarios:', usuarios);

    // También verificar consumos existentes
    const consumos = await prisma.consumo.findMany({
      take: 3,
      select: { 
        id: true, 
        total: true, 
        productos: true, 
        registeredAt: true,
        cliente: { select: { nombre: true } }
      }
    });
    console.log('🧾 Consumos existentes:', JSON.stringify(consumos, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

consultarIds();
