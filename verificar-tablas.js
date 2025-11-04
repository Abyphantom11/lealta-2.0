const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarTablas() {
  try {
    // Ejecutar query SQL directamente para ver todas las tablas
    const tablas = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%share%' OR table_name LIKE '%QR%'
      ORDER BY table_name;
    `;
    
    console.log('📊 Tablas relacionadas con Share o QR:\n');
    console.log(tablas);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarTablas();
