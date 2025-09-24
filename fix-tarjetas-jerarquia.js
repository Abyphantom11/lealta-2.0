// 🔧 Script para corregir y estabilizar la estructura jerárquica de tarjetas

const fs = require('fs');
const path = require('path');

// Estructura correcta esperada por el sistema
const JERARQUIA_CORRECTA = [
  {
    nivel: 'Bronce',
    nombrePersonalizado: 'Tarjeta Bronce',
    textoCalidad: 'Cliente Inicial',
    colores: {
      gradiente: ['#CD7F32', '#8B4513'],
      texto: '#FFFFFF',
      nivel: '#CD7F32'
    },
    condiciones: {
      puntosMinimos: 0,
      gastosMinimos: 0,
      visitasMinimas: 0
    },
    beneficio: 'Acceso a promociones básicas',
    activo: true
  },
  {
    nivel: 'Plata',
    nombrePersonalizado: 'Tarjeta Plata',
    textoCalidad: 'Cliente Frecuente',
    colores: {
      gradiente: ['#C0C0C0', '#808080'],
      texto: '#FFFFFF',
      nivel: '#C0C0C0'
    },
    condiciones: {
      puntosMinimos: 100,
      gastosMinimos: 500,
      visitasMinimas: 5
    },
    beneficio: '5% de descuento en compras',
    activo: true
  },
  {
    nivel: 'Oro',
    nombrePersonalizado: 'Tarjeta Oro',
    textoCalidad: 'Cliente VIP',
    colores: {
      gradiente: ['#FFD700', '#FFA500'],
      texto: '#FFFFFF',
      nivel: '#FFD700'
    },
    condiciones: {
      puntosMinimos: 500,
      gastosMinimos: 1500,
      visitasMinimas: 10
    },
    beneficio: '9 dadadasd', // Mantener el valor personalizado actual
    activo: true
  },
  {
    nivel: 'Diamante',
    nombrePersonalizado: 'Tarjeta Diamante',
    textoCalidad: 'Cliente Elite',
    colores: {
      gradiente: ['#B9F2FF', '#00CED1'],
      texto: '#FFFFFF',
      nivel: '#B9F2FF'
    },
    condiciones: {
      puntosMinimos: 1500,
      gastosMinimos: 3000,
      visitasMinimas: 15
    },
    beneficio: '15% de descuento + producto gratis',
    activo: true
  },
  {
    nivel: 'Platino',
    nombrePersonalizado: 'Tarjeta Platino',
    textoCalidad: 'Cliente Exclusivo',
    colores: {
      gradiente: ['#E5E4E2', '#C0C0C0'],
      texto: '#FFFFFF',
      nivel: '#E5E4E2'
    },
    condiciones: {
      puntosMinimos: 3000,
      gastosMinimos: 5000,
      visitasMinimas: 30
    },
    beneficio: '20% de descuento + 2 productos gratis',
    activo: true
  }
];

async function corregirEstructuraTarjetas() {
  console.log('🔧 CORRIGIENDO ESTRUCTURA JERÁRQUICA DE TARJETAS');
  console.log('=' . repeat(60));
  
  const businessId = 'cmfw0fujf0000eyv8eyhgfzja';
  const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
  
  try {
    // Leer configuración actual
    const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('\n📖 Configuración actual:');
    console.log(`   nombreEmpresa: "${currentConfig.nombreEmpresa}"`);
    console.log(`   tarjetas actuales: ${currentConfig.tarjetas?.length || 0}`);
    
    if (currentConfig.tarjetas?.length > 0) {
      currentConfig.tarjetas.forEach(t => {
        console.log(`     - ${t.nivel}: "${t.beneficio || 'N/A'}"`);
      });
    }
    
    // Preservar beneficio personalizado de Oro si existe
    const tarjetaOroActual = currentConfig.tarjetas?.find(t => 
      t.nivel === 'oro' || t.nivel === 'Oro'
    );
    
    if (tarjetaOroActual?.beneficio) {
      const tarjetaOroNueva = JERARQUIA_CORRECTA.find(t => t.nivel === 'Oro');
      if (tarjetaOroNueva) {
        tarjetaOroNueva.beneficio = tarjetaOroActual.beneficio;
        console.log(`\n✅ Preservando beneficio personalizado de Oro: "${tarjetaOroActual.beneficio}"`);
      }
    }
    
    // Crear nueva configuración con estructura corregida
    const nuevaConfig = {
      ...currentConfig,
      tarjetas: JERARQUIA_CORRECTA,
      nivelesConfig: {
        // Generar nivelesConfig basado en las tarjetas
        Bronce: {
          colores: { gradiente: ['#CD7F32', '#8B4513'] },
          textoDefault: 'Cliente Inicial',
          condiciones: { puntosMinimos: 0, gastosMinimos: 0, visitasMinimas: 0 }
        },
        Plata: {
          colores: { gradiente: ['#C0C0C0', '#808080'] },
          textoDefault: 'Cliente Frecuente',
          condiciones: { puntosMinimos: 100, gastosMinimos: 500, visitasMinimas: 5 }
        },
        Oro: {
          colores: { gradiente: ['#FFD700', '#FFA500'] },
          textoDefault: 'Cliente VIP',
          condiciones: { puntosMinimos: 500, gastosMinimos: 1500, visitasMinimas: 10 }
        },
        Diamante: {
          colores: { gradiente: ['#B9F2FF', '#00CED1'] },
          textoDefault: 'Cliente Elite',
          condiciones: { puntosMinimos: 1500, gastosMinimos: 3000, visitasMinimas: 15 }
        },
        Platino: {
          colores: { gradiente: ['#E5E4E2', '#C0C0C0'] },
          textoDefault: 'Cliente Exclusivo',
          condiciones: { puntosMinimos: 3000, gastosMinimos: 5000, visitasMinimas: 30 }
        }
      },
      lastUpdated: new Date().toISOString(),
      fixedHierarchy: true
    };
    
    // Guardar configuración corregida
    fs.writeFileSync(configPath, JSON.stringify(nuevaConfig, null, 2));
    
    console.log('\n✅ ESTRUCTURA CORREGIDA:');
    console.log(`   📄 Archivo: ${configPath}`);
    console.log(`   🎯 Tarjetas: ${nuevaConfig.tarjetas.length} niveles completos`);
    console.log(`   📊 Jerarquía: ${nuevaConfig.tarjetas.map(t => t.nivel).join(' → ')}`);
    
    console.log('\n🎯 NIVELES CONFIGURADOS:');
    nuevaConfig.tarjetas.forEach(tarjeta => {
      console.log(`   ${tarjeta.nivel}:`);
      console.log(`     - Beneficio: "${tarjeta.beneficio}"`);
      console.log(`     - Puntos mínimos: ${tarjeta.condiciones.puntosMinimos}`);
      console.log(`     - Visitas mínimas: ${tarjeta.condiciones.visitasMinimas}`);
    });
    
    console.log('\n🎉 ¡Corrección completada! La jerarquía ahora está estabilizada.');
    console.log('📋 Próximos pasos:');
    console.log('1. El admin panel ahora puede editar todos los niveles');
    console.log('2. La validación jerárquica debería pasar');
    console.log('3. Los clientes verán la estructura completa de niveles');
    
  } catch (error) {
    console.error('❌ Error corrigiendo estructura:', error);
  }
}

// Ejecutar corrección
corregirEstructuraTarjetas().catch(console.error);
