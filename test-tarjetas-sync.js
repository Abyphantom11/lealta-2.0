#!/usr/bin/env node

/**
 * 🔄 SCRIPT DE PRUEBA: Sincronización de Tarjetas Admin -> Cliente
 * 
 * Este script verifica que los cambios realizados en el admin panel
 * se reflejen correctamente en el portal cliente
 */

const fetch = require('node-fetch');

async function testTarjetasSync() {
  console.log('🧪 Testing tarjetas synchronization between admin and client...\n');
  
  try {
    // 1. Obtener el business ID desde el slug "arepa"
    console.log('1. 📍 Getting business ID from slug "arepa"...');
    const businessResponse = await fetch('http://localhost:3001/api/businesses/arepa/validate');
    
    if (!businessResponse.ok) {
      console.error('❌ Failed to validate business:', businessResponse.status);
      return;
    }
    
    const businessData = await businessResponse.json();
    console.log('✅ Business data:', businessData);
    
    // 2. Probar configuración del admin
    console.log('\n2. 🔧 Testing admin portal config...');
    const adminConfigResponse = await fetch('http://localhost:3001/api/admin/portal-config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessData.id
      }
    });
    
    if (adminConfigResponse.ok) {
      const adminConfig = await adminConfigResponse.json();
      console.log('✅ Admin config loaded successfully');
      console.log('📊 Admin tarjetas info:', {
        tarjetasCount: adminConfig.config?.tarjetas?.length || 0,
        nombreEmpresa: adminConfig.config?.nombreEmpresa,
        hasNivelesConfig: !!adminConfig.config?.nivelesConfig
      });
      
      if (adminConfig.config?.tarjetas?.length > 0) {
        console.log('🎯 First tarjeta structure:', {
          nivel: adminConfig.config.tarjetas[0].nivel,
          nombrePersonalizado: adminConfig.config.tarjetas[0].nombrePersonalizado,
          condiciones: adminConfig.config.tarjetas[0].condiciones
        });
      }
    } else {
      console.error('❌ Failed to get admin config:', adminConfigResponse.status);
    }
    
    // 3. Probar configuración del cliente
    console.log('\n3. 🌐 Testing client portal config...');
    const clientConfigResponse = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${businessData.id}`);
    
    if (clientConfigResponse.ok) {
      const clientConfig = await clientConfigResponse.json();
      console.log('✅ Client config loaded successfully');
      console.log('📊 Client tarjetas info:', {
        tarjetasCount: clientConfig.tarjetas?.length || 0,
        nombreEmpresa: clientConfig.nombreEmpresa,
        dataSource: clientConfig.settings?.dataSource
      });
      
      if (clientConfig.tarjetas?.length > 0) {
        console.log('🎯 First client tarjeta structure:', {
          nivel: clientConfig.tarjetas[0].nivel,
          nombrePersonalizado: clientConfig.tarjetas[0].nombrePersonalizado,
          condiciones: clientConfig.tarjetas[0].condiciones
        });
      }
    } else {
      console.error('❌ Failed to get client config:', clientConfigResponse.status);
    }
    
    // 4. Comparar configuraciones
    console.log('\n4. 🔍 Comparing configurations...');
    if (adminConfigResponse.ok && clientConfigResponse.ok) {
      const adminConfig = await adminConfigResponse.json();
      const clientConfig = await clientConfigResponse.json();
      
      const adminTarjetas = adminConfig.config?.tarjetas || [];
      const clientTarjetas = clientConfig.tarjetas || [];
      
      console.log('📋 Comparison results:');
      console.log(`  Admin tarjetas: ${adminTarjetas.length}`);
      console.log(`  Client tarjetas: ${clientTarjetas.length}`);
      console.log(`  Counts match: ${adminTarjetas.length === clientTarjetas.length ? '✅' : '❌'}`);
      
      if (adminTarjetas.length > 0 && clientTarjetas.length > 0) {
        const adminFirstTarjeta = adminTarjetas[0];
        const clientFirstTarjeta = clientTarjetas[0];
        
        console.log(`  First tarjeta nivel match: ${adminFirstTarjeta.nivel === clientFirstTarjeta.nivel ? '✅' : '❌'}`);
        console.log(`  Points requirement match: ${adminFirstTarjeta.condiciones?.puntosMinimos === clientFirstTarjeta.condiciones?.puntosMinimos ? '✅' : '❌'}`);
      }
      
      console.log(`  Business name match: ${adminConfig.config?.nombreEmpresa === clientConfig.nombreEmpresa ? '✅' : '❌'}`);
    }
    
    console.log('\n🎉 Sync test completed!');
    
  } catch (error) {
    console.error('❌ Error during sync test:', error);
  }
}

// Ejecutar el test
testTarjetasSync();
