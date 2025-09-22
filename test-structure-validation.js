// Crear configuración de prueba para verificar que la nueva función funciona
const fs = require('fs');
const path = require('path');

// Simular la función createDefaultPortalConfig (estructura corregida)
function createTestConfig(businessId, businessName) {
  const defaultConfig = {
    banners: [],
    promotions: [],
    promociones: [],
    events: [],
    rewards: [],
    recompensas: [],
    favorites: [],
    favoritoDelDia: [],
    // ✅ ESTRUCTURA CENTRALIZADA: 5 tarjetas con jerarquía validada
    tarjetas: [
      {
        id: 'tarjeta-bronce',
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
        beneficio: 'Acceso a promociones exclusivas',
        activo: true
      },
      {
        id: 'tarjeta-plata',
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
        id: 'tarjeta-oro',
        nivel: 'Oro',
        nombrePersonalizado: 'Tarjeta Oro',
        textoCalidad: 'Cliente Premium',
        colores: {
          gradiente: ['#FFD700', '#FFA500'],
          texto: '#000000',
          nivel: '#FFD700'
        },
        condiciones: {
          puntosMinimos: 500,
          gastosMinimos: 1500,
          visitasMinimas: 10
        },
        beneficio: '10% de descuento en compras',
        activo: true
      },
      {
        id: 'tarjeta-diamante',
        nivel: 'Diamante',
        nombrePersonalizado: 'Tarjeta Diamante',
        textoCalidad: 'Cliente VIP',
        colores: {
          gradiente: ['#B9F2FF', '#0891B2'],
          texto: '#FFFFFF',
          nivel: '#B9F2FF'
        },
        condiciones: {
          puntosMinimos: 1500,
          gastosMinimos: 3000,
          visitasMinimas: 20
        },
        beneficio: '15% de descuento en compras',
        activo: true
      },
      {
        id: 'tarjeta-platino',
        nivel: 'Platino',
        nombrePersonalizado: 'Tarjeta Platino',
        textoCalidad: 'Cliente Elite',
        colores: {
          gradiente: ['#E5E7EB', '#9CA3AF'],
          texto: '#FFFFFF',
          nivel: '#E5E7EB'
        },
        condiciones: {
          puntosMinimos: 3000,
          gastosMinimos: 5000,
          visitasMinimas: 30
        },
        beneficio: '20% de descuento en compras',
        activo: true
      }
    ],
    nombreEmpresa: businessName,
    settings: {
      lastUpdated: new Date().toISOString(),
      version: '2.0.0',
      createdBy: 'system-central',
      businessId: businessId,
    },
    nivelesConfig: {},
    lastUpdated: new Date().toISOString(),
    version: '2.0.0'
  };

  return defaultConfig;
}

// Test
async function testNewStructure() {
  try {
    const testId = 'test-new-structure-' + Date.now();
    const testName = 'Negocio Nuevo Test';
    
    console.log('🧪 Testing new centralized structure...');
    
    const config = createTestConfig(testId, testName);
    
    console.log(`✅ Config created for: ${testName}`);
    console.log(`📊 Tarjetas: ${config.tarjetas.length}`);
    
    // Verificar jerarquía
    const requiredLevels = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
    const foundLevels = config.tarjetas.map(t => t.nivel);
    const missingLevels = requiredLevels.filter(level => !foundLevels.includes(level));
    const pointsProgression = config.tarjetas.map(t => t.condiciones.puntosMinimos);
    
    console.log('\n🎯 Jerarquía:');
    config.tarjetas.forEach((tarjeta, index) => {
      console.log(`  ${index + 1}. ${tarjeta.nivel}: ${tarjeta.condiciones.puntosMinimos} puntos`);
    });
    
    console.log(`\n✅ Validation Results:`);
    console.log(`   Complete hierarchy: ${missingLevels.length === 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`   Points progression: [${pointsProgression.join(' → ')}]`);
    console.log(`   Structure format: ${config.tarjetas[0].condiciones ? '✅ NEW (condiciones)' : '❌ OLD (niveles)'}`);
    console.log(`   Version: ${config.version}`);
    
    // Verificar progresión lógica
    let progressionValid = true;
    for (let i = 1; i < pointsProgression.length; i++) {
      if (pointsProgression[i] <= pointsProgression[i-1]) {
        progressionValid = false;
        break;
      }
    }
    console.log(`   Logical progression: ${progressionValid ? '✅ YES' : '❌ NO'}`);
    
    return config;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNewStructure();
