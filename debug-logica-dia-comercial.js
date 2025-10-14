#!/usr/bin/env node

/**
 * 🔍 DEBUG: PROBLEMA CON LÓGICA DE DÍA COMERCIAL
 * 
 * Investiga por qué la API devuelve elementos incorrectos
 */

const fetch = require('node-fetch');

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function debugLogicaDiaComercial() {
  console.log('🔍 DEBUG: LÓGICA DE DÍA COMERCIAL');
  console.log('='.repeat(50));
  
  // 1. CALCULAR DÍA COMERCIAL MANUALMENTE
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  console.log(`⏰ Hora actual: ${hour}:${minute.toString().padStart(2, '0')}`);
  console.log(`📅 Día natural: ${['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()]}`);
  
  let diaComercialCalculado;
  if (hour < 4) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    diaComercialCalculado = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
    console.log(`🏢 Día comercial calculado: ${diaComercialCalculado} (día anterior porque es antes de 4 AM)`);
  } else {
    diaComercialCalculado = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    console.log(`🏢 Día comercial calculado: ${diaComercialCalculado} (día actual porque es después de 4 AM)`);
  }
  
  // 2. PROBAR APIs INDIVIDUALES
  console.log('\n📋 PROBANDO APIs INDIVIDUALES');
  console.log('-'.repeat(40));
  
  const apis = [
    { name: 'Banners', endpoint: '/api/portal/banners' },
    { name: 'Promociones', endpoint: '/api/portal/promociones' },
    { name: 'Favorito del día', endpoint: '/api/portal/favorito-del-dia' },
    { name: 'Config-v2', endpoint: '/api/portal/config-v2' }
  ];
  
  for (const api of apis) {
    console.log(`\n🔍 API ${api.name}:`);
    
    try {
      const url = `https://lealta.vercel.app${api.endpoint}?businessId=${BUSINESS_ID}`;
      const response = await fetch(url, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        console.log(`❌ Error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (api.endpoint === '/api/portal/config-v2') {
        // Para config-v2, extraer elementos individuales
        const banners = data.data?.banners || [];
        const promociones = data.data?.promociones || [];
        const favorito = data.data?.favoritoDelDia;
        
        console.log(`   📢 Banners devueltos: ${banners.length}`);
        banners.forEach((b, idx) => {
          console.log(`      ${idx + 1}. "${b.titulo}" | Día: ${b.dia || 'cualquiera'} | ¿Correcto? ${!b.dia || b.dia === diaComercialCalculado ? '✅' : '❌'}`);
        });
        
        console.log(`   🎁 Promociones devueltas: ${promociones.length}`);
        promociones.forEach((p, idx) => {
          console.log(`      ${idx + 1}. "${p.titulo}" | Día: ${p.dia || 'cualquiera'} | ¿Correcto? ${!p.dia || p.dia === diaComercialCalculado ? '✅' : '❌'}`);
        });
        
        if (favorito) {
          console.log(`   ⭐ Favorito devuelto: "${favorito.productName}" | Día: ${favorito.dia || 'cualquiera'} | ¿Correcto? ${!favorito.dia || favorito.dia === diaComercialCalculado ? '✅' : '❌'}`);
        } else {
          console.log(`   ⭐ Favorito devuelto: NINGUNO`);
        }
        
      } else if (api.endpoint === '/api/portal/banners') {
        const banners = data.banners || [];
        console.log(`   📢 Banners devueltos: ${banners.length}`);
        banners.forEach((b, idx) => {
          console.log(`      ${idx + 1}. "${b.titulo}" | Día: ${b.dia || 'cualquiera'} | ¿Correcto? ${!b.dia || b.dia === diaComercialCalculado ? '✅' : '❌'}`);
        });
        
      } else if (api.endpoint === '/api/portal/promociones') {
        const promociones = data.promociones || [];
        console.log(`   🎁 Promociones devueltas: ${promociones.length}`);
        promociones.forEach((p, idx) => {
          console.log(`      ${idx + 1}. "${p.titulo}" | Día: ${p.dia || 'cualquiera'} | ¿Correcto? ${!p.dia || p.dia === diaComercialCalculado ? '✅' : '❌'}`);
        });
        
      } else if (api.endpoint === '/api/portal/favorito-del-dia') {
        const favorito = data.favoritoDelDia;
        if (favorito) {
          console.log(`   ⭐ Favorito devuelto: "${favorito.productName}" | Día: ${favorito.dia || 'cualquiera'} | ¿Correcto? ${!favorito.dia || favorito.dia === diaComercialCalculado ? '✅' : '❌'}`);
        } else {
          console.log(`   ⭐ Favorito devuelto: NINGUNO`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // 3. CONCLUSIONES
  console.log('\n🎯 CONCLUSIONES');
  console.log('-'.repeat(20));
  console.log(`📅 Día comercial esperado: ${diaComercialCalculado}`);
  console.log(`🕐 Lógica de 4 AM: ${hour < 4 ? 'día anterior' : 'día actual'}`);
  console.log('\n💡 Si hay elementos incorrectos:');
  console.log('   1. La API no está usando getCurrentBusinessDay correctamente');
  console.log('   2. Hay diferencias de timezone entre cliente y servidor');
  console.log('   3. El filtrado en la API no funciona como esperado');
  console.log('   4. Hay cache que no se ha actualizado');
}

debugLogicaDiaComercial().catch(console.error);
