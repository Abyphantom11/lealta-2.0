const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

/**
 * 🧹 LIMPIEZA SEGURA DE QRs ANTIGUOS
 * 
 * Este script borra QRs de reservas de meses anteriores para aliviar la base de datos.
 * Los QRs se pueden regenerar cuando se abren, por lo que no es necesario mantenerlos indefinidamente.
 * 
 * IMPORTANTE: Se borra por FECHA DE RESERVA, no por fecha de creación del QR
 * - Un QR creado en octubre para una reserva de noviembre SE MANTIENE
 * - Un QR creado en noviembre para una reserva de octubre SE BORRA
 * 
 * SEGURIDAD:
 * - Solo borra QRs de reservas de meses ANTERIORES al mes actual
 * - NUNCA toca QRs de reservas del mes actual o futuras
 * - Crea backup automático antes de borrar
 * - Requiere confirmación explícita
 */

async function limpiarQRsAntiguos() {
  try {
    console.log('🧹 LIMPIEZA SEGURA DE QRs ANTIGUOS');
    console.log('='.repeat(70));
    console.log('⚠️  Este proceso borrará QRs de RESERVAS de meses anteriores');
    console.log('📅 Criterio: Fecha de RESERVA (reservedAt), no fecha de creación del QR');
    console.log('✅ Los QRs de reservas del mes actual se mantendrán intactos\n');
    
    // 1. Obtener fecha actual
    const ahora = new Date();
    const mesActual = ahora.getMonth(); // 0-11
    const añoActual = ahora.getFullYear();
    
    // 2. Calcular inicio del mes actual
    const inicioMesActual = new Date(Date.UTC(añoActual, mesActual, 1, 0, 0, 0, 0));
    
    console.log('📅 Fechas de referencia:');
    console.log(`   Hoy: ${ahora.toISOString().split('T')[0]}`);
    console.log(`   Inicio mes actual: ${inicioMesActual.toISOString().split('T')[0]}`);
    console.log(`   Se borrarán QRs de RESERVAS ANTES de: ${inicioMesActual.toISOString()}\n`);
    
    // 3. Contar QRs a borrar (por fecha de RESERVA, no de creación)
    const qrsABorrar = await prisma.reservationQRCode.findMany({
      where: {
        Reservation: {
          reservedAt: {
            lt: inicioMesActual
          }
        }
      },
      include: {
        Reservation: {
          select: {
            customerName: true,
            reservedAt: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
    
    console.log(`📊 QRs encontrados para borrar: ${qrsABorrar.length}\n`);
    
    if (qrsABorrar.length === 0) {
      console.log('✅ No hay QRs antiguos para borrar. Base de datos limpia.');
      return;
    }
    
    // 4. Mostrar resumen por mes (basado en fecha de RESERVA)
    const porMes = {};
    qrsABorrar.forEach(qr => {
      const fecha = new Date(qr.Reservation.reservedAt);
      const mesAño = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!porMes[mesAño]) {
        porMes[mesAño] = {
          cantidad: 0,
          escaneos: 0
        };
      }
      porMes[mesAño].cantidad++;
      porMes[mesAño].escaneos += qr.scanCount;
    });
    
    console.log('📋 RESUMEN POR MES:');
    console.log('-'.repeat(70));
    Object.keys(porMes).sort().forEach(mes => {
      const data = porMes[mes];
      console.log(`   ${mes}: ${data.cantidad} QRs (${data.escaneos} escaneos)`);
    });
    console.log('');
    
    // 5. Mostrar muestra de QRs a borrar
    console.log('📝 MUESTRA DE QRs A BORRAR (primeros 5):');
    console.log('-'.repeat(70));
    qrsABorrar.slice(0, 5).forEach((qr, index) => {
      console.log(`${index + 1}. ${qr.Reservation?.customerName || 'Sin nombre'}`);
      console.log(`   Token: ${qr.qrToken}`);
      console.log(`   QR creado: ${qr.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Reserva para: ${new Date(qr.Reservation.reservedAt).toISOString().split('T')[0]}`);
      console.log(`   Escaneos: ${qr.scanCount}`);
      console.log('');
    });
    
    // 6. Crear backup antes de borrar
    console.log('💾 CREANDO BACKUP DE SEGURIDAD...');
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `qrs-backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify({
      fecha: new Date().toISOString(),
      totalQRs: qrsABorrar.length,
      qrs: qrsABorrar
    }, null, 2));
    
    console.log(`✅ Backup creado: ${backupFile}\n`);
    
    // 7. CONFIRMACIÓN DE SEGURIDAD
    console.log('⚠️  CONFIRMACIÓN REQUERIDA');
    console.log('='.repeat(70));
    console.log(`   Se borrarán ${qrsABorrar.length} QRs de meses anteriores`);
    console.log(`   Los QRs del mes actual (${mesActual + 1}/${añoActual}) NO se tocarán`);
    console.log(`   Backup guardado en: ${backupFile}`);
    console.log('');
    console.log('   Para ejecutar el borrado, ejecuta:');
    console.log(`   node limpiar-qrs-antiguos.js --confirmar`);
    console.log('');
    
    // 8. Verificar si se pasó el flag --confirmar
    const confirmar = process.argv.includes('--confirmar');
    
    if (!confirmar) {
      console.log('ℹ️  Modo simulación - No se borraron datos');
      console.log('   Revisa el resumen arriba y ejecuta con --confirmar para proceder');
      return;
    }
    
    // 9. BORRAR QRs (solo si se confirmó)
    console.log('🗑️  BORRANDO QRs...');
    
    const resultado = await prisma.reservationQRCode.deleteMany({
      where: {
        Reservation: {
          reservedAt: {
            lt: inicioMesActual
          }
        }
      }
    });
    
    console.log(`✅ LIMPIEZA COMPLETADA`);
    console.log('='.repeat(70));
    console.log(`   QRs borrados: ${resultado.count}`);
    console.log(`   Backup: ${backupFile}`);
    console.log(`   Espacio liberado: ~${(resultado.count * 0.5).toFixed(2)} KB (estimado)`);
    console.log('');
    
    // 10. Verificar QRs restantes
    const qrsRestantes = await prisma.reservationQRCode.count();
    const qrsMesActual = await prisma.reservationQRCode.count({
      where: {
        createdAt: {
          gte: inicioMesActual
        }
      }
    });
    
    console.log('📊 ESTADO FINAL:');
    console.log(`   QRs totales en BD: ${qrsRestantes}`);
    console.log(`   QRs del mes actual: ${qrsMesActual}`);
    console.log('');
    console.log('✅ Base de datos optimizada correctamente');
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    console.error('');
    console.error('⚠️  Si ocurrió un error después de borrar, puedes restaurar desde:');
    console.error('   backups/qrs-backup-[timestamp].json');
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
limpiarQRsAntiguos();
