const fs = require('fs');
const path = require('path');

// Simular la función getTarjetasConfigCentral para debug
async function debugGetTarjetasConfigCentral(businessId) {
  console.log(`🎯 [DEBUG] Obteniendo configuración de tarjetas para business: ${businessId}`);
  
  try {
    // Construir ruta del archivo de configuración
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    let tarjetas = [];
    let nombreEmpresa = 'Mi Negocio';
    
    // Intentar leer configuración específica del business
    if (fs.existsSync(configPath)) {
      console.log(`✅ [DEBUG] Archivo de configuración encontrado: ${configPath}`);
      
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      console.log(`📄 [DEBUG] Estructura del config:`, {
        hasTarjetas: !!config.tarjetas,
        isArray: Array.isArray(config.tarjetas),
        length: config.tarjetas?.length || 0,
        firstTarjeta: config.tarjetas?.[0] || null
      });
      
      // LEER TARJETAS DIRECTAMENTE DEL JSON (NUEVA ESTRUCTURA)
      if (config.tarjetas && Array.isArray(config.tarjetas)) {
        console.log(`✅ [DEBUG] Estructura nueva detectada: ${config.tarjetas.length} tarjetas directas`);
        
        tarjetas = config.tarjetas.map((tarjeta, index) => {
          console.log(`🔍 [DEBUG] Procesando tarjeta ${index}:`, {
            nivel: tarjeta.nivel,
            beneficio: tarjeta.beneficio,
            condiciones: tarjeta.condiciones
          });
          
          return {
            id: tarjeta.id || `tarjeta-${tarjeta.nivel.toLowerCase()}`,
            nivel: tarjeta.nivel,
            nombrePersonalizado: tarjeta.nombrePersonalizado || `Tarjeta ${tarjeta.nivel}`,
            textoCalidad: tarjeta.textoCalidad || tarjeta.beneficio || `Cliente ${tarjeta.nivel}`,
            colores: {
              gradiente: tarjeta.colores?.gradiente || ['#666666', '#999999'],
              texto: tarjeta.colores?.texto || '#FFFFFF',
              nivel: tarjeta.colores?.nivel || tarjeta.colores?.gradiente?.[0] || '#666666'
            },
            condiciones: {
              puntosMinimos: tarjeta.condiciones?.puntosMinimos || 0,
              gastosMinimos: tarjeta.condiciones?.gastosMinimos || 0,
              visitasMinimas: tarjeta.condiciones?.visitasMinimas || 0
            },
            beneficio: tarjeta.beneficio || `Cliente ${tarjeta.nivel}`,
            activo: tarjeta.activo !== undefined ? tarjeta.activo : true
          };
        });
        
        console.log(`✅ [DEBUG] Transformadas ${tarjetas.length} tarjetas desde JSON nuevo`);
        console.log(`📋 [DEBUG] Tarjetas transformadas:`, tarjetas.map(t => ({
          nivel: t.nivel,
          beneficio: t.beneficio,
          puntosMinimos: t.condiciones.puntosMinimos,
          visitasMinimas: t.condiciones.visitasMinimas
        })));
      } 
      
      // Nombre de empresa
      nombreEmpresa = config.nombreEmpresa || 'Mi Negocio';
      
    } else {
      console.log(`❌ [DEBUG] Archivo de configuración NO encontrado: ${configPath}`);
    }
    
    return {
      tarjetas,
      nombreEmpresa,
      jerarquiaValida: true,
      erroresValidacion: []
    };
    
  } catch (error) {
    console.error(`💥 [DEBUG] Error obteniendo config central:`, error);
    return {
      tarjetas: [],
      nombreEmpresa: 'Mi Negocio',
      jerarquiaValida: false,
      erroresValidacion: [`Error leyendo configuración: ${error.message}`]
    };
  }
}

// Simular cómo el endpoint procesa las tarjetas
async function debugClientEndpoint(businessId) {
  console.log(`\n🌐 [DEBUG] Simulando endpoint del cliente para: ${businessId}`);
  
  const adminConfig = await debugGetTarjetasConfigCentral(businessId);
  
  if (adminConfig && adminConfig.tarjetas && adminConfig.tarjetas.length > 0) {
    console.log(`✅ [DEBUG] Admin config obtenido, procesando ${adminConfig.tarjetas.length} tarjetas`);
    
    // Esta es la lógica que usa el endpoint del cliente
    const tarjetaBase = adminConfig.tarjetas[0]; // Primera tarjeta con niveles?
    console.log(`🔍 [DEBUG] Primera tarjeta:`, tarjetaBase);
    
    // El endpoint espera que adminConfig.tarjetas sea una estructura con niveles
    // Pero nosotros tenemos un array directo de tarjetas
    console.log(`⚠️ [DEBUG] El endpoint espera estructura antigua, pero tenemos estructura nueva`);
    
    // Vamos a devolver las tarjetas directamente
    const clientTarjetas = adminConfig.tarjetas.map(tarjeta => ({
      id: `tarjeta-${tarjeta.nivel.toLowerCase()}`,
      nivel: tarjeta.nivel,
      nombrePersonalizado: `Tarjeta ${tarjeta.nivel}`,
      beneficio: tarjeta.beneficio,
      condiciones: tarjeta.condiciones,
      colores: tarjeta.colores,
      activo: tarjeta.activo
    }));
    
    console.log(`📤 [DEBUG] Tarjetas que recibiría el cliente:`, clientTarjetas);
    return clientTarjetas;
  } else {
    console.log(`❌ [DEBUG] No se obtuvo admin config válido`);
    return [];
  }
}

// Ejecutar debug
debugClientEndpoint('cmfw0fujf0000eyv8eyhgfzja').then(result => {
  console.log(`\n🎯 [RESULTADO] Tarjetas finales para el cliente:`, result);
}).catch(error => {
  console.error(`💥 [ERROR] Error en debug:`, error);
});
