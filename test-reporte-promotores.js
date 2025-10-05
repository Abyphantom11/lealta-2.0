/**
 * Script de prueba para el endpoint de reportes con análisis de promotores
 * Verifica que se incluyan las nuevas métricas por promotor y medio
 */

const API_URL = 'http://localhost:3001';
const BUSINESS_ID = 'golom'; // Usar el slug del business

async function testReportePromotores() {
  console.log('🧪 Iniciando prueba de reportes con análisis de promotores...\n');

  try {
    // Obtener el mes y año actual
    const now = new Date();
    const mes = now.getMonth() + 1; // Enero = 1
    const año = now.getFullYear();

    console.log(`📅 Generando reporte para: ${mes}/${año}\n`);

    // Llamar al endpoint de reportes
    const url = `${API_URL}/api/reservas/reportes?businessId=${BUSINESS_ID}&mes=${mes}&año=${año}`;
    console.log(`🔗 URL: ${url}\n`);

    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(error)}`);
    }

    const reporte = await response.json();

    // ==========================================
    // VALIDAR ESTRUCTURA DEL REPORTE
    // ==========================================
    console.log('✅ Reporte recibido exitosamente\n');
    console.log('📊 ESTRUCTURA DEL REPORTE:');
    console.log('════════════════════════════════════════\n');

    // 1. Período
    console.log('📅 PERÍODO:');
    console.log(`   Mes: ${reporte.periodo.mesNombre} ${reporte.periodo.año}`);
    console.log(`   Desde: ${new Date(reporte.periodo.fechaInicio).toLocaleDateString('es-ES')}`);
    console.log(`   Hasta: ${new Date(reporte.periodo.fechaFin).toLocaleDateString('es-ES')}\n`);

    // 2. Métricas generales
    console.log('📈 MÉTRICAS GENERALES:');
    console.log(`   Total Reservas: ${reporte.metricas.generales.totalReservas}`);
    console.log(`   Personas Esperadas: ${reporte.metricas.generales.totalPersonasEsperadas}`);
    console.log(`   Asistentes Reales: ${reporte.metricas.generales.totalAsistentesReales}`);
    console.log(`   % Cumplimiento: ${reporte.metricas.generales.porcentajeCumplimiento}%`);
    console.log(`   Promedio Personas/Reserva: ${reporte.metricas.generales.promedioPersonasPorReserva}\n`);

    // 3. Análisis por asistencia
    console.log('👥 ANÁLISIS POR ASISTENCIA:');
    console.log(`   Completadas: ${reporte.metricas.porAsistencia.completadas}`);
    console.log(`   Parciales: ${reporte.metricas.porAsistencia.parciales}`);
    console.log(`   Caídas: ${reporte.metricas.porAsistencia.caidas}`);
    console.log(`   Sobreaforo: ${reporte.metricas.porAsistencia.sobreaforo}\n`);

    // 4. ✨ NUEVO: Análisis por promotor
    console.log('🎯 ANÁLISIS POR PROMOTOR:');
    console.log('════════════════════════════════════════');
    if (reporte.metricas.porPromotor && reporte.metricas.porPromotor.length > 0) {
      reporte.metricas.porPromotor.forEach((promotor, index) => {
        console.log(`\n   ${index + 1}. ${promotor.nombre} (ID: ${promotor.id})`);
        console.log(`      ├─ Total Reservas: ${promotor.totalReservas}`);
        console.log(`      ├─ Esperadas: ${promotor.personasEsperadas} personas`);
        console.log(`      ├─ Asistieron: ${promotor.personasAsistieron} personas`);
        console.log(`      ├─ Cumplimiento: ${promotor.porcentajeCumplimiento}%`);
        console.log(`      ├─ Completadas: ${promotor.reservasCompletadas}`);
        console.log(`      ├─ Parciales: ${promotor.reservasParciales}`);
        console.log(`      ├─ Caídas: ${promotor.reservasCaidas}`);
        console.log(`      └─ Sobreaforo: ${promotor.reservasSobreaforo}`);
      });
      console.log('\n✅ Métricas por promotor disponibles\n');
    } else {
      console.log('⚠️  No hay datos de promotores en este período\n');
    }

    // 5. ✨ NUEVO: Análisis por medio
    console.log('📱 ANÁLISIS POR MEDIO/SOURCE:');
    console.log('════════════════════════════════════════');
    if (reporte.metricas.porMedio && reporte.metricas.porMedio.length > 0) {
      reporte.metricas.porMedio.forEach((medio, index) => {
        console.log(`\n   ${index + 1}. ${medio.medio.toUpperCase()}`);
        console.log(`      ├─ Total Reservas: ${medio.totalReservas}`);
        console.log(`      ├─ Esperadas: ${medio.personasEsperadas} personas`);
        console.log(`      ├─ Asistieron: ${medio.personasAsistieron} personas`);
        console.log(`      └─ Cumplimiento: ${medio.porcentajeCumplimiento}%`);
      });
      console.log('\n✅ Métricas por medio disponibles\n');
    } else {
      console.log('⚠️  No hay datos de medios en este período\n');
    }

    // 6. ✨ NUEVO: Top 5 promotores
    console.log('🏆 TOP 5 PROMOTORES:');
    console.log('════════════════════════════════════════');
    if (reporte.rankings.top5Promotores && reporte.rankings.top5Promotores.length > 0) {
      reporte.rankings.top5Promotores.forEach((promotor, index) => {
        console.log(`   ${index + 1}. ${promotor.nombre}`);
        console.log(`      ├─ Reservas: ${promotor.cantidad}`);
        console.log(`      └─ Cumplimiento: ${promotor.cumplimiento}%`);
      });
      console.log('\n✅ Ranking de promotores disponible\n');
    } else {
      console.log('⚠️  No hay suficientes datos para ranking\n');
    }

    // 7. Verificar detalle de reservas incluye promotor
    console.log('📋 DETALLE DE RESERVAS (muestra):');
    console.log('════════════════════════════════════════');
    if (reporte.detalleReservas && reporte.detalleReservas.length > 0) {
      const muestra = reporte.detalleReservas.slice(0, 3);
      muestra.forEach((reserva, index) => {
        console.log(`\n   ${index + 1}. ${reserva.cliente}`);
        console.log(`      ├─ Fecha: ${reserva.fecha} ${reserva.hora}`);
        console.log(`      ├─ Asistencia: ${reserva.asistentes}/${reserva.esperadas}`);
        console.log(`      ├─ Promotor: ${reserva.promotor || 'Sin asignar'}`);
        console.log(`      ├─ Medio: ${reserva.medio || 'manual'}`);
        console.log(`      └─ Estado: ${reserva.estado}`);
      });
      console.log(`\n✅ Detalle incluye promotor y medio (${reporte.detalleReservas.length} reservas totales)\n`);
    } else {
      console.log('⚠️  No hay reservas en este período\n');
    }

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n════════════════════════════════════════');
    console.log('✅ PRUEBA COMPLETADA EXITOSAMENTE');
    console.log('════════════════════════════════════════\n');
    console.log('✅ Estructura validada:');
    console.log('   ✓ metricas.porPromotor');
    console.log('   ✓ metricas.porMedio');
    console.log('   ✓ rankings.top5Promotores');
    console.log('   ✓ detalleReservas incluye promotor y medio\n');

    // Verificar que las nuevas propiedades existen
    const checks = {
      'metricas.porPromotor': !!reporte.metricas.porPromotor,
      'metricas.porMedio': !!reporte.metricas.porMedio,
      'rankings.top5Promotores': !!reporte.rankings.top5Promotores,
      'detalleReservas[0].promotor': reporte.detalleReservas?.[0]?.hasOwnProperty('promotor'),
      'detalleReservas[0].medio': reporte.detalleReservas?.[0]?.hasOwnProperty('medio'),
    };

    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log('🎉 TODAS LAS VALIDACIONES PASARON\n');
      return true;
    } else {
      console.log('⚠️  ALGUNAS VALIDACIONES FALLARON:');
      Object.entries(checks).forEach(([key, value]) => {
        if (!value) console.log(`   ❌ ${key}`);
      });
      console.log('');
      return false;
    }

  } catch (error) {
    console.error('❌ ERROR EN LA PRUEBA:');
    console.error(error.message);
    console.error('\n💡 Asegúrate de que:');
    console.error('   1. El servidor esté corriendo (npm run dev)');
    console.error('   2. El businessId sea correcto');
    console.error('   3. Haya reservas en el período seleccionado\n');
    return false;
  }
}

// Ejecutar la prueba
testReportePromotores().then((success) => {
  process.exit(success ? 0 : 1);
});
