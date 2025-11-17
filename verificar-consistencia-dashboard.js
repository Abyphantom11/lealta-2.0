// Script para verificar que dashboard y reportes coinciden
// Ejecutar: node verificar-consistencia-dashboard.js

async function verificarConsistencia() {
  try {
    const businessId = 'cmgh621rd0012lb0aixrzpvrw'; // Love Me Sky
    
    console.log('🔍 Verificando consistencia Dashboard vs Reportes...\n');
    
    // 1. Obtener reporte de noviembre
    const reporteResponse = await fetch(
      `http://localhost:3001/api/reservas/reportes?businessId=${businessId}&mes=11&año=2025`
    );
    
    if (!reporteResponse.ok) {
      console.error('❌ Error obteniendo reporte');
      return;
    }
    
    const reporte = await reporteResponse.json();
    
    console.log('📊 REPORTE (API de Reportes):');
    console.log(`   Total Reservas: ${reporte.metricas.generales.totalReservas}`);
    console.log(`   Total Asistentes: ${reporte.metricas.generales.totalAsistentesReales}`);
    console.log(`   Sin Reserva: ${reporte.metricas.generales.totalPersonasSinReserva}`);
    console.log('');
    
    console.log('📋 Estados (Reportes):');
    console.log(`   ✅ CHECKED_IN: ${reporte.metricas.porEstado.checkedIn}`);
    console.log(`   ❌ NO_SHOW: ${reporte.metricas.porEstado.noShow}`);
    console.log(`   ✔️  COMPLETED: ${reporte.metricas.porEstado.completed}`);
    console.log(`   🚫 CANCELLED: ${reporte.metricas.porEstado.cancelled}`);
    console.log('');
    
    // 2. Obtener todas las reservas del mes
    const reservasResponse = await fetch(
      `http://localhost:3001/api/reservas?businessId=${businessId}`
    );
    
    if (!reservasResponse.ok) {
      console.error('❌ Error obteniendo reservas');
      return;
    }
    
    const reservasData = await reservasResponse.json();
    const reservas = reservasData.reservas || reservasData; // Manejar diferentes formatos
    
    // Filtrar solo noviembre 2025
    const reservasNoviembre = reservas.filter((r) => {
      const fecha = new Date(r.reservedAt);
      return fecha.getMonth() === 10 && fecha.getFullYear() === 2025; // Mes 10 = noviembre (0-indexed)
    });
    
    // Contar por estado (DB)
    const enProgreso = reservasNoviembre.filter(r => r.status === 'PENDING').length;
    const checkedIn = reservasNoviembre.filter(r => r.status === 'CHECKED_IN').length;
    const noShow = reservasNoviembre.filter(r => r.status === 'NO_SHOW').length;
    const completed = reservasNoviembre.filter(r => r.status === 'COMPLETED').length;
    const cancelled = reservasNoviembre.filter(r => r.status === 'CANCELLED').length;
    const confirmed = reservasNoviembre.filter(r => r.status === 'CONFIRMED').length;
    
    const estadosFinales = checkedIn + noShow + completed + cancelled;
    
    console.log('📊 DASHBOARD (API de Reservas):');
    console.log(`   Total Reservas DB: ${reservasNoviembre.length}`);
    console.log(`   Estados finales: ${estadosFinales}`);
    console.log('');
    
    console.log('📋 Estados (DB):');
    console.log(`   🔄 PENDING (En Progreso): ${enProgreso}`);
    console.log(`   🔄 CONFIRMED: ${confirmed}`);
    console.log(`   ✅ CHECKED_IN: ${checkedIn}`);
    console.log(`   ❌ NO_SHOW: ${noShow}`);
    console.log(`   ✔️  COMPLETED: ${completed}`);
    console.log(`   🚫 CANCELLED: ${cancelled}`);
    console.log('');
    
    // Verificar consistencia
    console.log('✅ VERIFICACIÓN:');
    
    if (estadosFinales === reporte.metricas.generales.totalReservas) {
      console.log(`   ✓ Total coincide: ${estadosFinales} = ${reporte.metricas.generales.totalReservas}`);
    } else {
      console.log(`   ✗ Total NO coincide: ${estadosFinales} ≠ ${reporte.metricas.generales.totalReservas}`);
    }
    
    if (enProgreso > 0 || confirmed > 0) {
      console.log(`   ⚠️  Hay ${enProgreso + confirmed} reservas pendientes que NO aparecen en reportes (correcto)`);
    }
    
    console.log('');
    console.log('🎯 RESUMEN:');
    console.log(`   Dashboard debería mostrar: ${estadosFinales} reservas`);
    console.log(`   Reportes muestran: ${reporte.metricas.generales.totalReservas} reservas`);
    console.log(`   ¿Coinciden? ${estadosFinales === reporte.metricas.generales.totalReservas ? '✅ SÍ' : '❌ NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verificarConsistencia();
