#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE DIAGNÓSTICO: Verificar datos específicos de la tarjeta Plata
 */

const fetch = require('node-fetch');

async function checkPlataBenefit() {
  console.log('🔍 Checking Plata card benefit specifically...\n');
  
  try {
    // Obtener business ID
    const businessResponse = await fetch('http://localhost:3001/api/businesses/arepa/validate');
    const businessData = await businessResponse.json();
    
    console.log('📍 Business ID:', businessData.id);
    
    // Obtener configuración del cliente
    console.log('\n📥 Getting client config with cache-busting...');
    const clientConfig = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${businessData.id}&_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const config = await clientConfig.json();
    
    console.log('📊 Full client config info:', {
      tarjetasCount: config.tarjetas?.length || 0,
      nombreEmpresa: config.nombreEmpresa,
      dataSource: config.settings?.dataSource,
      timestamp: config.settings?.lastUpdated
    });
    
    // Buscar específicamente la tarjeta Plata
    if (config.tarjetas?.length > 0) {
      const plataTarjeta = config.tarjetas.find(t => t.nivel === 'Plata');
      
      if (plataTarjeta) {
        console.log('\n🎯 TARJETA PLATA - Configuración detallada:');
        console.log('  ID:', plataTarjeta.id);
        console.log('  Nivel:', plataTarjeta.nivel);
        console.log('  Nombre Personalizado:', plataTarjeta.nombrePersonalizado);
        console.log('  Texto de Calidad:', plataTarjeta.textoCalidad);
        console.log('  Beneficio:', `"${plataTarjeta.beneficio}"`);
        console.log('  Puntos Mínimos:', plataTarjeta.condiciones?.puntosMinimos);
        console.log('  Visitas Mínimas:', plataTarjeta.condiciones?.visitasMinimas);
        console.log('  Activa:', plataTarjeta.activo);
        
        // Verificar si el beneficio coincide con el esperado
        const expectedBenefit = '9 dadadasd';
        const actualBenefit = plataTarjeta.beneficio;
        
        console.log('\n🔍 VERIFICACIÓN DEL BENEFICIO:');
        console.log('  Esperado:', `"${expectedBenefit}"`);
        console.log('  Actual:', `"${actualBenefit}"`);
        console.log('  Match:', actualBenefit === expectedBenefit ? '✅ CORRECTO' : '❌ INCORRECTO');
        
        if (actualBenefit !== expectedBenefit) {
          console.log('\n❌ PROBLEMA IDENTIFICADO:');
          console.log('  - El archivo JSON contiene el valor correcto');
          console.log('  - Pero el API está devolviendo un valor diferente');
          console.log('  - Esto sugiere un problema en el mapeo de datos');
        }
      } else {
        console.log('❌ Tarjeta Plata no encontrada');
      }
      
      // Mostrar todas las tarjetas para debug
      console.log('\n📋 TODAS LAS TARJETAS:');
      config.tarjetas.forEach((tarjeta, index) => {
        console.log(`  ${index + 1}. ${tarjeta.nivel}: "${tarjeta.beneficio}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPlataBenefit();
