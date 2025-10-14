e de da#!/usr/bin/env node

/**
 * 🕐 ANÁLISIS: PROBLEMA DE TIMEZONE
 * 
 * Verificar si el problema es que el servidor (Vercel) 
 * está en un timezone diferente al cliente
 */

const fetch = require('node-fetch');

async function analizarTimezone() {
  console.log('🕐 ANÁLISIS DE TIMEZONE');
  console.log('='.repeat(35));
  
  // 1. INFORMACIÓN LOCAL
  console.log('\n📱 1. INFORMACIÓN LOCAL (Cliente)');
  console.log('-'.repeat(40));
  
  const ahora = new Date();
  const horaLocal = ahora.getHours();
  const minutoLocal = ahora.getMinutes();
  const diaLocal = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][ahora.getDay()];
  
  console.log(`⏰ Hora local: ${horaLocal}:${minutoLocal.toString().padStart(2, '0')}`);
  console.log(`📅 Día local: ${diaLocal}`);
  console.log(`🌍 Timezone local: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  
  // Calcular día comercial local
  let diaComercialLocal;
  if (horaLocal < 4) {
    const ayer = new Date(ahora);
    ayer.setDate(ayer.getDate() - 1);
    diaComercialLocal = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][ayer.getDay()];
    console.log(`🏢 Día comercial local: ${diaComercialLocal} (día anterior)`);
  } else {
    diaComercialLocal = diaLocal;
    console.log(`🏢 Día comercial local: ${diaComercialLocal} (día actual)`);
  }
  
  // 2. INFORMACIÓN DEL SERVIDOR (UTC)
  console.log('\n🌐 2. SIMULACIÓN DEL SERVIDOR (UTC)');
  console.log('-'.repeat(45));
  
  const ahoraUTC = new Date();
  const horaUTC = ahoraUTC.getUTCHours();
  const minutoUTC = ahoraUTC.getUTCMinutes();
  const diaUTC = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][ahoraUTC.getUTCDay()];
  
  console.log(`⏰ Hora UTC (servidor): ${horaUTC}:${minutoUTC.toString().padStart(2, '0')}`);
  console.log(`📅 Día UTC (servidor): ${diaUTC}`);
  
  // Calcular día comercial del servidor
  let diaComercialServidor;
  if (horaUTC < 4) {
    const ayerUTC = new Date(ahoraUTC);
    ayerUTC.setUTCDate(ayerUTC.getUTCDate() - 1);
    diaComercialServidor = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][ayerUTC.getUTCDay()];
    console.log(`🏢 Día comercial servidor: ${diaComercialServidor} (día anterior UTC)`);
  } else {
    diaComercialServidor = diaUTC;
    console.log(`🏢 Día comercial servidor: ${diaComercialServidor} (día actual UTC)`);
  }
  
  // 3. COMPARACIÓN
  console.log('\n🔍 3. COMPARACIÓN');
  console.log('-'.repeat(20));
  
  console.log(`Cliente dice: "${diaComercialLocal}"`);
  console.log(`Servidor dice: "${diaComercialServidor}"`);
  
  if (diaComercialLocal !== diaComercialServidor) {
    console.log('❌ ¡AQUÍ ESTÁ EL PROBLEMA!');
    console.log('   El cliente y el servidor calculan días comerciales diferentes');
    console.log('   Esto explica por qué la API devuelve elementos "incorrectos"');
    
    const diferenceiaHoras = horaLocal - horaUTC;
    console.log(`   📊 Diferencia horaria: ${diferenceiaHoras} horas`);
    
  } else {
    console.log('✅ Cliente y servidor calculan el mismo día comercial');
    console.log('   El problema debe estar en otra parte');
  }
  
  // 4. VERIFICAR QUE ELEMENTOS DEBERÍAN MOSTRARSE SEGÚN EL SERVIDOR
  console.log('\n📋 4. ELEMENTOS QUE DEBERÍAN MOSTRARSE');
  console.log('-'.repeat(45));
  
  console.log(`Según el cliente (${diaComercialLocal}):`);
  console.log('   - Elementos que tengan dia="' + diaComercialLocal + '" o dia=null');
  
  console.log(`Según el servidor (${diaComercialServidor}):`);
  console.log('   - Elementos que tengan dia="' + diaComercialServidor + '" o dia=null');
  
  // 5. PROBAR API PARA CONFIRMAR
  console.log('\n🧪 5. PROBAR API PARA CONFIRMAR');
  console.log('-'.repeat(35));
  
  try {
    const url = 'https://lealta.vercel.app/api/portal/config-v2?businessId=cmgf5px5f0000eyy0elci9yds';
    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const banners = data.data?.banners || [];
      const promociones = data.data?.promociones || [];
      const favorito = data.data?.favoritoDelDia;
      
      console.log('API devuelve:');
      banners.forEach(b => {
        console.log(`   📢 Banner "${b.titulo}" para día "${b.dia}"`);
      });
      promociones.forEach(p => {
        console.log(`   🎁 Promoción "${p.titulo}" para día "${p.dia}"`);
      });
      if (favorito) {
        console.log(`   ⭐ Favorito "${favorito.productName}" para día "${favorito.dia}"`);
      }
      
      // Verificar si coincide con la predicción del servidor
      const elementosCoinciden = (banners.length === 0 || banners.every(b => !b.dia || b.dia === diaComercialServidor)) &&
                                (promociones.length === 0 || promociones.every(p => !p.dia || p.dia === diaComercialServidor)) &&
                                (!favorito || !favorito.dia || favorito.dia === diaComercialServidor);
      
      if (elementosCoinciden) {
        console.log(`✅ Los elementos coinciden con la predicción del servidor (${diaComercialServidor})`);
        console.log('   Confirmado: El problema es timezone entre cliente y servidor');
      } else {
        console.log(`❌ Los elementos NO coinciden con ninguna predicción`);
        console.log('   Hay otro problema además del timezone');
      }
    }
  } catch (error) {
    console.log(`❌ Error probando API: ${error.message}`);
  }
  
  // 6. SOLUCIONES
  console.log('\n💡 6. SOLUCIONES');
  console.log('-'.repeat(20));
  
  if (diaComercialLocal !== diaComercialServidor) {
    console.log('🔧 SOLUCIONES PARA EL PROBLEMA DE TIMEZONE:');
    console.log('   1. Configurar timezone en las funciones getCurrentBusinessDay');
    console.log('   2. Crear elementos para ambos días (lunes y martes)');
    console.log('   3. Usar elementos sin restricción de día (dia=null)');
    console.log('   4. Ajustar la lógica de 4 AM según el timezone del negocio');
  }
}

analizarTimezone().catch(console.error);
