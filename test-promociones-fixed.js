// Test actualizado con la nueva lógica de horarios
const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function testGetPromocionesFixed() {
  console.log('🔄 TESTING getPromociones CON NUEVA LÓGICA');
  console.log('==========================================');
  
  try {
    // 1. Simular llamada al endpoint
    const response = await fetch(`http://localhost:3001/api/portal/config?businessId=${businessId}&timestamp=${Date.now()}`);
    const result = await response.json();
    const promociones = result.data.promociones || [];
    
    console.log('📄 Promociones en JSON:', promociones.length);
    
    // 2. Aplicar filtros como lo hace el componente (día actual)
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaHoy = diasSemana[new Date().getDay()];
    
    const promocionesActivas = promociones.filter((p) => p.activo !== false);
    const promocionesHoy = promocionesActivas.filter((p) => {
      if (p.dia) {
        return p.dia === diaHoy;
      }
      return true;
    });
    
    console.log(`📅 Promociones para ${diaHoy}:`, promocionesHoy.length);
    
    // 3. Aplicar nueva lógica de horarios
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    
    const promocionesValidas = promocionesHoy.filter((p) => {
      if (!p.activo) return false;

      if (p.horaTermino) {
        const [horas, minutos] = p.horaTermino.split(':').map(Number);
        let horaTermino = horas * 60 + minutos;
        
        // 🔄 NUEVA LÓGICA: horarios < 6 AM se interpretan como día siguiente
        if (horas < 6) {
          horaTermino += 24 * 60;
          console.log(`  "${p.titulo}": ${p.horaTermino} → interpretado como día siguiente (${horaTermino} min)`);
        } else {
          console.log(`  "${p.titulo}": ${p.horaTermino} → mismo día (${horaTermino} min)`);
        }
        
        const esValida = horaActual < horaTermino;
        console.log(`    Hora actual: ${horaActual} min → ${esValida ? '✅ VÁLIDA' : '❌ EXPIRADA'}`);
        
        return esValida;
      }

      return true;
    });
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log(`Promociones válidas: ${promocionesValidas.length}`);
    console.log(`¿Se mostrarían promociones? ${promocionesValidas.length > 0 ? '✅ SÍ' : '❌ NO'}`);
    
    promocionesValidas.forEach((p, i) => {
      console.log(`  ${i + 1}. "${p.titulo}" - ${p.descripcion}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGetPromocionesFixed();
