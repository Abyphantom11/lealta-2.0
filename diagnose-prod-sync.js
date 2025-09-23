#!/usr/bin/env node

/**
 * 🚨 DIAGNÓSTICO DE PRODUCCIÓN: Portal Config Sync
 * 
 * Este script diagnostica por qué la sincronización no funciona en producción
 */

const fetch = require('node-fetch');

async function diagnoseProdSync() {
  console.log('🚨 Diagnosing production sync issues...\n');
  
  const prodUrl = 'https://range-conditional-affiliate-motion.try.cloudflare.com'; // Tu URL de producción
  const localUrl = 'http://localhost:3001';
  
  try {
    console.log('1. 📡 Testing production business validation...');
    
    // Test production business validation
    const prodBusinessResponse = await fetch(`${prodUrl}/api/businesses/arepa/validate`);
    
    if (prodBusinessResponse.ok) {
      const prodBusiness = await prodBusinessResponse.json();
      console.log('✅ Production business validation works:', {
        id: prodBusiness.id,
        name: prodBusiness.name,
        subdomain: prodBusiness.subdomain
      });
      
      // Test production portal config
      console.log('\n2. 🌐 Testing production portal config...');
      
      const prodConfigResponse = await fetch(`${prodUrl}/api/portal/config-v2?businessId=${prodBusiness.id}&_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (prodConfigResponse.ok) {
        const prodConfig = await prodConfigResponse.json();
        console.log('✅ Production portal config loaded:', {
          tarjetasCount: prodConfig.tarjetas?.length || 0,
          nombreEmpresa: prodConfig.nombreEmpresa,
          dataSource: prodConfig.settings?.dataSource,
          timestamp: prodConfig.settings?.lastUpdated
        });
        
        // Check specific Plata card
        const plataTarjeta = prodConfig.tarjetas?.find(t => t.nivel === 'Plata');
        if (plataTarjeta) {
          console.log('🎯 Production Plata card:', {
            beneficio: plataTarjeta.beneficio,
            nombrePersonalizado: plataTarjeta.nombrePersonalizado,
            textoCalidad: plataTarjeta.textoCalidad
          });
        }
        
        // Compare with local
        console.log('\n3. 🔄 Comparing with local environment...');
        
        try {
          const localBusinessResponse = await fetch(`${localUrl}/api/businesses/arepa/validate`);
          const localBusiness = await localBusinessResponse.json();
          
          const localConfigResponse = await fetch(`${localUrl}/api/portal/config-v2?businessId=${localBusiness.id}&_t=${Date.now()}`);
          const localConfig = await localConfigResponse.json();
          
          const localPlataTarjeta = localConfig.tarjetas?.find(t => t.nivel === 'Plata');
          
          console.log('📊 Environment comparison:');
          console.log('  Production Plata benefit:', plataTarjeta?.beneficio || 'NOT FOUND');
          console.log('  Local Plata benefit:', localPlataTarjeta?.beneficio || 'NOT FOUND');
          console.log('  Benefits match:', (plataTarjeta?.beneficio === localPlataTarjeta?.beneficio) ? '✅' : '❌');
          console.log('  Production data source:', prodConfig.settings?.dataSource);
          console.log('  Local data source:', localConfig.settings?.dataSource);
          
        } catch (localError) {
          console.log('⚠️ Local environment not available for comparison');
        }
        
      } else {
        console.log('❌ Production portal config failed:', prodConfigResponse.status);
        const errorText = await prodConfigResponse.text();
        console.log('Error details:', errorText.substring(0, 500));
      }
      
    } else {
      console.log('❌ Production business validation failed:', prodBusinessResponse.status);
      const errorText = await prodBusinessResponse.text();
      console.log('Error details:', errorText.substring(0, 500));
    }
    
    // Additional checks
    console.log('\n4. 🔍 Additional production diagnostics...');
    
    // Check if admin endpoint is accessible (it shouldn't be without auth)
    const adminConfigResponse = await fetch(`${prodUrl}/api/admin/portal-config`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Admin endpoint status:', adminConfigResponse.status, adminConfigResponse.status === 401 ? '✅ (Properly protected)' : '❌ (Security issue)');
    
    // Test specific client URL from your screenshot
    console.log('\n5. 🎯 Testing actual client URL...');
    const clientResponse = await fetch(`${prodUrl}/arepa/cliente/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('Client page status:', clientResponse.status);
    if (clientResponse.ok) {
      console.log('✅ Client page is accessible');
    }
    
  } catch (error) {
    console.error('❌ Error during production diagnosis:', error);
  }
}

diagnoseProdSync();
