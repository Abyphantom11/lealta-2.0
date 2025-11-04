/**
 * Script manual para limpiar QR codes antiguos
 * Uso: npx tsx scripts/qr-cleanup-manual.ts [--dry-run]
 */

import { cleanupWithDryRun, getQRStats } from '../src/lib/qr-cleanup';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('═════════════════════════════════════════════════════');
  console.log('🧹 LIMPIEZA DE QR CODES - RESERVAS ANTIGUAS');
  console.log('═════════════════════════════════════════════════════');
  console.log('');

  try {
    // Mostrar estadísticas actuales
    console.log('📊 Estadísticas actuales de QR codes:');
    console.log('─────────────────────────────────────────────────────');
    const stats = await getQRStats();
    console.log(`📅 Mes actual: ${stats.currentMonth}`);
    console.log(`Total de QR codes: ${stats.total}`);
    console.log(`├─ QRs del mes actual: ${stats.recent}`);
    console.log(`├─ QRs de meses anteriores: ${stats.old} 🗑️`);
    console.log(`├─ Activos: ${stats.active}`);
    console.log(`├─ Usados: ${stats.used}`);
    console.log(`└─ Expirados: ${stats.expired}`);
    console.log('');
    console.log(`Límite de antigüedad: ${stats.threshold.toISOString()}`);
    console.log('─────────────────────────────────────────────────────');
    console.log('');

    if (stats.old === 0) {
      console.log('✅ No hay QR codes antiguos para eliminar');
      console.log('');
      process.exit(0);
    }

    // Ejecutar limpieza
    if (dryRun) {
      console.log('🔍 MODO DRY RUN - No se eliminará nada');
      console.log('');
    } else {
      console.log('⚠️  ADVERTENCIA: Se eliminarán QR codes permanentemente');
      console.log('');
    }

    const result = await cleanupWithDryRun(dryRun);

    console.log('');
    console.log('═════════════════════════════════════════════════════');
    console.log('📋 RESUMEN DE LIMPIEZA');
    console.log('═════════════════════════════════════════════════════');
    console.log(`QR codes ${dryRun ? 'a eliminar' : 'eliminados'}: ${result.totalDeleted}`);
    
    if (result.totalDeleted > 0) {
      console.log(`Fecha más antigua: ${result.oldestDate?.toISOString()}`);
      console.log(`Fecha más reciente: ${result.newestDate?.toISOString()}`);
      console.log(`Negocios afectados: ${Object.keys(result.businesses).length}`);
      console.log('');
      console.log('Por negocio:');
      Object.entries(result.businesses).forEach(([businessId, count]) => {
        console.log(`  ${businessId}: ${count} QRs`);
      });
    }
    console.log('═════════════════════════════════════════════════════');
    console.log('');

    if (dryRun) {
      console.log('💡 Para ejecutar la limpieza real, ejecuta:');
      console.log('   npx tsx scripts/qr-cleanup-manual.ts');
    } else {
      console.log('✅ Limpieza completada exitosamente');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
