/**
 * 🔍 EXTRAER HOST TRACKING DE OCTUBRE DESDE BACKUP
 * 
 * Extrae todos los registros de HostTracking del backup del 31 de octubre
 * para poder restaurarlos o analizarlos
 */

const fs = require('fs');
const path = require('path');

async function extraerHostTrackingOctubre() {
  console.log('🔍 EXTRAYENDO HOST TRACKING DE OCTUBRE DESDE BACKUP\n');
  console.log('='.repeat(60));

  try {
    // Leer el backup del 31 de octubre (último día del mes)
    const backupPath = path.join(__dirname, 'backups', 'backup_json_2025-10-31T07-17-41Z.json');
    
    console.log(`📂 Leyendo backup: ${backupPath}`);
    
    if (!fs.existsSync(backupPath)) {
      console.error('❌ Archivo no encontrado');
      return;
    }

    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const backup = JSON.parse(backupContent);

    console.log(`✅ Backup cargado correctamente`);
    console.log(`📊 Tamaño: ${(backupContent.length / 1024).toFixed(2)} KB\n`);

    // Extraer HostTracking
    const hostTracking = backup.HostTracking || [];
    const reservations = backup.Reservation || [];

    console.log(`📊 CONTENIDO DEL BACKUP:`);
    console.log(`   Total Reservations: ${reservations.length}`);
    console.log(`   Total HostTracking: ${hostTracking.length}\n`);

    // Filtrar HostTracking de octubre 2025
    const hostTrackingOctubre = hostTracking.filter(ht => {
      if (!ht.reservationDate) return false;
      const fecha = new Date(ht.reservationDate);
      return fecha.getMonth() === 9 && fecha.getFullYear() === 2025; // Octubre = mes 9
    });

    console.log(`📅 HOST TRACKING DE OCTUBRE 2025: ${hostTrackingOctubre.length} registros\n`);

    if (hostTrackingOctubre.length === 0) {
      console.log('⚠️ NO SE ENCONTRARON REGISTROS DE HOST TRACKING PARA OCTUBRE');
      console.log('\n💡 Esto significa que:');
      console.log('   1. Las reservas de octubre NO tenían asistencia registrada');
      console.log('   2. No se escanearon QRs en octubre');
      console.log('   3. Por eso el reporte muestra 0 asistentes reales');
      return;
    }

    // Análisis de los datos
    const totalAsistentes = hostTrackingOctubre.reduce((sum, ht) => sum + (ht.guestCount || 0), 0);
    
    console.log(`👥 ESTADÍSTICAS:`);
    console.log(`   Total asistentes registrados: ${totalAsistentes} personas`);
    console.log(`   Promedio por registro: ${(totalAsistentes / hostTrackingOctubre.length).toFixed(1)} personas\n`);

    // Agrupar por día
    const porDia = hostTrackingOctubre.reduce((acc, ht) => {
      const fecha = new Date(ht.reservationDate).toLocaleDateString('es-ES');
      if (!acc[fecha]) {
        acc[fecha] = { registros: 0, asistentes: 0 };
      }
      acc[fecha].registros++;
      acc[fecha].asistentes += ht.guestCount || 0;
      return acc;
    }, {});

    console.log(`📅 ASISTENCIAS POR DÍA (primeros 10):`);
    Object.entries(porDia)
      .sort((a, b) => b[1].asistentes - a[1].asistentes)
      .slice(0, 10)
      .forEach(([fecha, data]) => {
        console.log(`   ${fecha}: ${data.asistentes} asistentes (${data.registros} registros)`);
      });

    // Guardar los datos extraídos para análisis o restauración
    const outputPath = path.join(__dirname, 'hosttracking-octubre-extraido.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      fecha_extraccion: new Date().toISOString(),
      backup_origen: 'backup_json_2025-10-31T07-17-41Z.json',
      periodo: 'Octubre 2025',
      estadisticas: {
        total_registros: hostTrackingOctubre.length,
        total_asistentes: totalAsistentes,
        promedio_por_registro: (totalAsistentes / hostTrackingOctubre.length).toFixed(1)
      },
      por_dia: porDia,
      datos: hostTrackingOctubre
    }, null, 2));

    console.log(`\n💾 Datos guardados en: ${outputPath}`);
    console.log('\n✅ EXTRACCIÓN COMPLETADA');

    // Verificar si hay reservas de octubre en el backup
    const reservasOctubre = reservations.filter(r => {
      if (!r.reservedAt) return false;
      const fecha = new Date(r.reservedAt);
      return fecha.getMonth() === 9 && fecha.getFullYear() === 2025;
    });

    console.log(`\n📋 RESERVAS DE OCTUBRE EN EL BACKUP:`);
    console.log(`   Total: ${reservasOctubre.length}`);
    
    if (reservasOctubre.length > 0) {
      console.log(`\n💡 Las reservas SÍ existen en el backup del 31/10`);
      console.log(`   Pueden ser restauradas si es necesario`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

extraerHostTrackingOctubre();
