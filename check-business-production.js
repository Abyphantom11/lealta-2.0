#!/usr/bin/env node

/**
 * 🔍 VERIFICAR: ¿Existe el businessId en producción?
 */

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function checkBusinessInProduction() {
  console.log('🔍 VERIFICANDO BUSINESS EN PRODUCCIÓN');
  console.log('='.repeat(50));
  
  try {
    const validateUrl = `https://lealta.vercel.app/api/businesses/${businessId}/validate`;
    
    console.log(`📡 Probando: ${validateUrl}`);
    
    const response = await fetch(validateUrl);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Business encontrado en producción:');
      console.log(`   - ID: ${data.id}`);
      console.log(`   - Name: ${data.name}`);
      console.log(`   - Subdomain: ${data.subdomain}`);
      console.log(`   - Slug: ${data.slug}`);
      console.log(`   - Active: ${data.isActive}`);
      
      // Ahora probar config-v2 con este business confirmado
      console.log('\n📡 Probando config-v2 con business confirmado...');
      const configResponse = await fetch(`https://lealta.vercel.app/api/portal/config-v2?businessId=${data.id}`);
      console.log(`Config Status: ${configResponse.status}`);
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        console.log('📊 Configuración del portal:');
        console.log(`   - Success: ${configData.success}`);
        if (configData.data) {
          console.log(`   - Banners: ${configData.data.banners?.length || 0}`);
          console.log(`   - Promociones: ${configData.data.promociones?.length || 0}`);
          console.log(`   - Favoritos: ${!!configData.data.favoritoDelDia}`);
          console.log(`   - Source: ${configData.data.source}`);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Business NO encontrado en producción');
      console.log(`Error: ${errorText}`);
      
      console.log('\n💡 SOLUCIONES:');
      console.log('1. El businessId no existe en producción');
      console.log('2. Usar un businessId diferente que exista');
      console.log('3. Crear el business en la BD de producción');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBusinessInProduction().catch(console.error);
