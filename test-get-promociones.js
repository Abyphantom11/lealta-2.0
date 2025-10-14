// Test específico para verificar qué devuelve getPromociones
const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function testGetPromociones() {
  console.log('🔍 TESTING getPromociones');
  console.log('==========================');
  
  try {
    // 1. Simular llamada al endpoint como lo hace useAutoRefreshPortalConfig
    const response = await fetch(`http://localhost:3001/api/portal/config?businessId=${businessId}&timestamp=${Date.now()}`);
    const result = await response.json();
    const config = { data: result.data };
    
    console.log('📄 Raw config.data.promociones:', config.data.promociones);
    
    // 2. Simular lógica de getPromociones para domingo
    const promociones = config.data.promociones || config.data.promotions || [];
    const todasActivas = promociones.filter((p) => p.activo !== false) || [];
    
    console.log('\n📊 Promociones activas (sin filtro de día):', todasActivas.length);
    todasActivas.forEach((p, i) => {
      console.log(`  ${i + 1}. "${p.titulo}" - Día: ${p.dia} - Activo: ${p.activo}`);
    });
    
    // 3. Aplicar filtro de día actual (domingo)
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaHoy = diasSemana[new Date().getDay()];
    
    console.log(`\n📅 Día actual: ${diaHoy}`);
    
    const promocionesHoy = todasActivas.filter((p) => {
      // ✅ MANEJAR TANTO 'dia' (string) COMO 'dias' (array)
      if (p.dia) {
        // Formato JSON: campo 'dia' como string
        return p.dia === diaHoy || p.dia?.toLowerCase() === diaHoy?.toLowerCase();
      } else if (p.dias && Array.isArray(p.dias)) {
        // Formato PostgreSQL: campo 'dias' como array
        return p.dias.includes(diaHoy);
      }
      return true; // Sin restricción de días
    });
    
    console.log(`\n🎯 Promociones para ${diaHoy}:`, promocionesHoy.length);
    promocionesHoy.forEach((p, i) => {
      console.log(`  ${i + 1}. "${p.titulo}" - Día: ${p.dia} - Activo: ${p.activo}`);
    });
    
    // 4. Verificar horarios (como hace el componente)
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    
    console.log(`\n⏰ Hora actual: ${ahora.getHours()}:${ahora.getMinutes().toString().padStart(2, '0')} (${horaActual} minutos)`);
    
    const promocionesValidasHorario = promocionesHoy.filter((p) => {
      // Si tiene hora de término, verificar que no haya terminado
      if (p.horaTermino) {
        const [horas, minutos] = p.horaTermino.split(':').map(Number);
        const horaTermino = horas * 60 + minutos;
        console.log(`    "${p.titulo}" termina a las ${p.horaTermino} (${horaTermino} minutos)`);
        return horaActual < horaTermino;
      }
      return true;
    });
    
    console.log(`\n✅ Promociones válidas (día + horario):`, promocionesValidasHorario.length);
    promocionesValidasHorario.forEach((p, i) => {
      console.log(`  ${i + 1}. "${p.titulo}" - Termina: ${p.horaTermino || 'Sin límite'}`);
    });
    
    // 5. Resultado final
    console.log('\n📱 RESULTADO FINAL:');
    console.log(`¿Se mostrarían promociones? ${promocionesValidasHorario.length > 0 ? 'SÍ' : 'NO'}`);
    console.log(`Cantidad a mostrar: ${promocionesValidasHorario.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGetPromociones();
