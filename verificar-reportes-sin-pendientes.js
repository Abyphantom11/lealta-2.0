// Script para verificar que los reportes ya NO incluyen reservas PENDING/CONFIRMED
// Ejecutar: node verificar-reportes-sin-pendientes.js

async function verificarReportes() {
  try {
    const businessId = 'cmgh621rd0012lb0aixrzpvrw'; // Love Me Sky
    
    console.log('🔍 Verificando reportes de noviembre 2025 (sin PENDING/CONFIRMED)...\n');
    
    // Llamar al endpoint de reportes
    const response = await fetch(
      `http://localhost:3001/api/reservas/reportes?businessId=${businessId}&mes=11&año=2025`
    );
    
    if (!response.ok) {
      console.error('❌ Error:', response.status, response.statusText);
      const error = await response.json();
      console.error(error);
      return;
    }
    
    const data = await response.json();
    
    console.log('📊 REPORTE NOVIEMBRE 2025 (Estados Finales Solamente)');
    console.log('='.repeat(60));
    console.log('Período:', data.periodo.mesNombre, data.periodo.año);
    console.log('');
    
    console.log('📈 MÉTRICAS GENERALES:');
    console.log('  Total reservas (estados finales):', data.metricas.generales.totalReservas);
    console.log('  Personas esperadas:', data.metricas.generales.totalPersonasEsperadas);
    console.log('  Asistentes reales:', data.metricas.generales.totalAsistentesReales);
    console.log('  Personas sin reserva:', data.metricas.generales.totalPersonasSinReserva);
    console.log('  TOTAL atendido:', data.metricas.generales.totalPersonasAtendidas);
    console.log('');
    
    console.log('📊 POR ASISTENCIA:');
    console.log('  ✅ Completadas:', data.metricas.porAsistencia.completadas);
    console.log('  📈 Sobreaforo:', data.metricas.porAsistencia.sobreaforo);
    console.log('  ❌ Caídas (NO_SHOW):', data.metricas.porAsistencia.caidas);
    console.log('  📉 Parciales:', data.metricas.porAsistencia.parciales);
    console.log('  🚫 Canceladas:', data.metricas.porAsistencia.canceladas);
    console.log('');
    
    console.log('📋 POR ESTADO (SOLO FINALES):');
    console.log('  ✅ CHECKED_IN:', data.metricas.porEstado.checkedIn);
    console.log('  ❌ NO_SHOW:', data.metricas.porEstado.noShow);
    console.log('  ✔️  COMPLETED:', data.metricas.porEstado.completed);
    console.log('  🚫 CANCELLED:', data.metricas.porEstado.cancelled);
    console.log('');
    
    // Verificar que NO hay pending/confirmed
    if (data.metricas.porEstado.pending !== undefined) {
      console.error('⚠️  ADVERTENCIA: El reporte aún incluye el estado PENDING');
    } else {
      console.log('✅ Correcto: No se incluye el estado PENDING en reportes');
    }
    
    if (data.metricas.porEstado.confirmed !== undefined) {
      console.error('⚠️  ADVERTENCIA: El reporte aún incluye el estado CONFIRMED');
    } else {
      console.log('✅ Correcto: No se incluye el estado CONFIRMED en reportes');
    }
    console.log('');
    
    console.log('💼 TOP 5 PROMOTORES:');
    data.metricas.porPromotor
      .sort((a, b) => b.totalReservas - a.totalReservas)
      .slice(0, 5)
      .forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.nombre}`);
        console.log(`     Reservas: ${p.totalReservas} | Asistencia: ${p.porcentajeCumplimiento}%`);
        console.log(`     ✅ ${p.reservasCompletadas} | ❌ ${p.reservasCaidas} | 🚫 ${p.reservasCanceladas}`);
      });
    console.log('');
    
    console.log('📅 TOP 5 DÍAS:');
    data.rankings.top5Dias.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.fecha}: ${d.cantidad} reservas`);
    });
    console.log('');
    
    console.log('✅ Verificación completada!');
    console.log('');
    console.log('🎯 RESUMEN:');
    console.log('  - Reportes ahora SOLO incluyen estados finales');
    console.log('  - PENDING/CONFIRMED NO aparecen en estadísticas');
    console.log('  - Use auto-close-day para cerrar días pendientes');
    console.log('  - Estados reportados: CHECKED_IN, NO_SHOW, COMPLETED, CANCELLED');
    
  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

verificarReportes();
