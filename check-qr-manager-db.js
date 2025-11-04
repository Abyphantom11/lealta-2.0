const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkQRManagerDB() {
  try {
    console.log('🔍 ANÁLISIS DE QR MANAGER EN BASE DE DATOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Obtener todas las tablas de la base de datos
    const models = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    console.log('📋 TABLAS EN LA BASE DE DATOS:');
    models.forEach(m => {
      if (m.tablename.toLowerCase().includes('qr')) {
        console.log(`  ✓ ${m.tablename} (relacionada con QR)`);
      } else {
        console.log(`  - ${m.tablename}`);
      }
    });
    console.log('');

    // Buscar específicamente tablas de QR Manager
    const qrManagerTables = models.filter(m => 
      m.tablename.toLowerCase() === 'qrlink' || 
      m.tablename.toLowerCase() === 'qrclick'
    );

    if (qrManagerTables.length > 0) {
      console.log('✅ TABLAS DE QR MANAGER ENCONTRADAS:');
      qrManagerTables.forEach(t => console.log(`  - ${t.tablename}`));
      
      // Si existe, contar registros
      try {
        const qrLinkCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "QRLink"`;
        console.log(`  📊 Total QRLinks: ${qrLinkCount[0].count}`);
      } catch(e) {
        console.log('  ⚠️ No se pudo contar QRLinks');
      }
    } else {
      console.log('❌ NO HAY TABLAS DE QR MANAGER EN LA BASE DE DATOS');
      console.log('   Las tablas "QRLink" y "QRClick" NO existen');
    }
    console.log('');

    // Contar QRs de reservas (que SÍ existen)
    console.log('📊 QRS DE RESERVAS (ReservationQRCode):');
    const reservationQRCount = await prisma.reservationQRCode.count();
    console.log(`  Total: ${reservationQRCount} QR codes de reservas`);
    
    if (reservationQRCount > 0) {
      const activeQRs = await prisma.reservationQRCode.count({
        where: { status: 'ACTIVE' }
      });
      const usedQRs = await prisma.reservationQRCode.count({
        where: { status: 'USED' }
      });
      console.log(`  - Activos: ${activeQRs}`);
      console.log(`  - Usados: ${usedQRs}`);
    }
    console.log('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 RESUMEN:');
    console.log('  QR Manager (QRLink/QRClick): ❌ NO EXISTE en la BD');
    console.log('  QRs de Reservas: ✅ Sí existe');
    console.log('');
    console.log('💡 CONCLUSIÓN:');
    console.log('  La página /qr-manager existe en el código pero NO tiene');
    console.log('  el modelo en la base de datos. Necesita migración.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQRManagerDB();
