const { PrismaClient } = require('@prisma/client');

async function identificarProblemaSync() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 IDENTIFICANDO PROBLEMA DE SINCRONIZACIÓN\n');
    
    const businessDemoId = 'cmgf5px5f0000eyy0elci9yds';
    
    // 1. VERIFICAR QUE TABLAS EXISTEN Y TIENEN DATOS
    console.log('📊 1. VERIFICANDO ESTRUCTURA DE DATOS...');
    
    // Tabla LEGACY (lo que usa el frontend actual)
    const reservasLegacy = await prisma.reserva.count({
      where: { businessId: businessDemoId }
    });
    
    // Tabla NUEVA (lo que usa el QR scanner)
    const reservationsNew = await prisma.reservation.count({
      where: { businessId: businessDemoId }
    });
    
    console.log(`   📋 Tabla LEGACY (reserva): ${reservasLegacy} registros`);
    console.log(`   🆕 Tabla NUEVA (reservation): ${reservationsNew} registros`);
    
    // 2. VER DATOS DE MUESTRA
    if (reservasLegacy > 0) {
      console.log('\n📋 DATOS EN TABLA LEGACY (reserva):');
      const muestraLegacy = await prisma.reserva.findMany({
        take: 3,
        where: { businessId: businessDemoId },
        select: {
          id: true,
          clientName: true,
          date: true,
          time: true,
          guestCount: true,
          attendance: true,
          status: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      muestraLegacy.forEach(r => {
        console.log(`   - ${r.clientName} | ${r.date} ${r.time} | ${r.attendance || 0}/${r.guestCount} | ${r.status}`);
      });
    }
    
    if (reservationsNew > 0) {
      console.log('\n🆕 DATOS EN TABLA NUEVA (reservation):');
      const muestraNew = await prisma.reservation.findMany({
        take: 3,
        where: { businessId: businessDemoId },
        include: { qrCodes: true },
        orderBy: { createdAt: 'desc' }
      });
      
      muestraNew.forEach(r => {
        const totalScans = r.qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0);
        console.log(`   - ${r.customerName} | ${r.reservedAt} | ${totalScans}/${r.guestCount} | ${r.status}`);
      });
    }
    
    // 3. ANALIZAR EL PROBLEMA
    console.log('\n⚠️ 3. ANÁLISIS DEL PROBLEMA:');
    
    if (reservasLegacy > 0 && reservationsNew === 0) {
      console.log('   🎯 PROBLEMA: Solo hay datos en tabla LEGACY');
      console.log('   📱 QR Scanner busca datos en tabla NUEVA (vacía)');
      console.log('   🖥️ Frontend muestra datos de tabla LEGACY');
      console.log('   🔗 NO HAY SINCRONIZACIÓN entre las dos tablas');
    } else if (reservasLegacy === 0 && reservationsNew > 0) {
      console.log('   🎯 PROBLEMA: Solo hay datos en tabla NUEVA');
      console.log('   📱 QR Scanner actualiza tabla NUEVA ✅');
      console.log('   🖥️ Frontend lee tabla LEGACY (vacía) ❌');
      console.log('   🔗 FALTA MIGRACIÓN de datos NUEVA → LEGACY');
    } else if (reservasLegacy > 0 && reservationsNew > 0) {
      console.log('   🎯 PROBLEMA: Datos en AMBAS tablas');
      console.log('   📱 QR Scanner actualiza tabla NUEVA ✅');
      console.log('   🖥️ Frontend lee tabla LEGACY ✅');
      console.log('   🔗 FALTA SINCRONIZACIÓN automática entre tablas');
    } else {
      console.log('   🎯 PROBLEMA: NO HAY DATOS en ninguna tabla');
      console.log('   📱 QR Scanner no tiene datos para escanear');
      console.log('   🖥️ Frontend no tiene datos para mostrar');
    }
    
    // 4. SOLUCIONES RECOMENDADAS
    console.log('\n🛠️ 4. SOLUCIONES RECOMENDADAS:');
    
    if (reservasLegacy > 0 && reservationsNew === 0) {
      console.log('   1. Migrar datos: reserva → reservation');
      console.log('   2. Generar QR codes para reservas existentes');
      console.log('   3. Configurar QR scanner para tabla correcta');
    } else if (reservationsNew > 0) {
      console.log('   1. INMEDIATA: Configurar frontend para leer tabla reservation');
      console.log('   2. RÁPIDA: Crear trigger/hook para sync reservation → reserva');
      console.log('   3. IDEAL: Unificar a una sola tabla y actualizar todo el código');
    }
    
    console.log('\n🔧 5. ACCIÓN INMEDIATA PARA TU PROBLEMA:');
    console.log('   📡 El QR scanner YA ESTÁ configurado correctamente');
    console.log('   🎯 NECESITAS: Cambiar el frontend para leer de tabla reservation');
    console.log('   🔄 O: Agregar sincronización reservation → reserva después de QR scan');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

identificarProblemaSync();
