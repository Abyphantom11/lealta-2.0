#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO COMPLETO: APIs, Fetch y Arrays
 * 
 * Analiza el flujo completo desde la BD hasta el cliente
 * para identificar dónde se pierden los datos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';
const PRODUCTION_URL = 'https://lealta.vercel.app';
const DEV_URL = 'http://localhost:3001';

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO: APIs, Fetch y Arrays');
  console.log('='.repeat(60));

  // 1. VERIFICAR DATOS EN BASE DE DATOS
  console.log('\n📊 1. DATOS EN BASE DE DATOS (PostgreSQL)');
  console.log('-'.repeat(60));

  const [banners, promociones, favoritos] = await Promise.all([
    prisma.portalBanner.findMany({
      where: { businessId: BUSINESS_ID }
    }),
    prisma.portalPromocion.findMany({
      where: { businessId: BUSINESS_ID }
    }),
    prisma.portalFavoritoDelDia.findMany({
      where: { businessId: BUSINESS_ID }
    })
  ]);

  console.log(`\n📢 BANNERS en BD: ${banners.length}`);
  banners.forEach((b, i) => {
    console.log(`   ${i + 1}. "${b.title}"`);
    console.log(`      - ID: ${b.id}`);
    console.log(`      - Active: ${b.active}`);
    console.log(`      - Día: ${b.dia || 'cualquiera'}`);
    console.log(`      - imageUrl: ${b.imageUrl ? '✅ TIENE' : '❌ NO TIENE'}`);
    console.log(`      - imageUrl value: "${b.imageUrl || 'null'}"`);
  });

  console.log(`\n🎁 PROMOCIONES en BD: ${promociones.length}`);
  promociones.forEach((p, i) => {
    console.log(`   ${i + 1}. "${p.title}"`);
    console.log(`      - ID: ${p.id}`);
    console.log(`      - Active: ${p.active}`);
    console.log(`      - Día: ${p.dia || 'cualquiera'}`);
    console.log(`      - imageUrl: ${p.imageUrl ? '✅ TIENE' : '❌ NO TIENE'}`);
    console.log(`      - imageUrl value: "${p.imageUrl || 'null'}"`);
  });

  console.log(`\n⭐ FAVORITOS en BD: ${favoritos.length}`);
  favoritos.forEach((f, i) => {
    console.log(`   ${i + 1}. "${f.productName}"`);
    console.log(`      - ID: ${f.id}`);
    console.log(`      - Active: ${f.active}`);
    console.log(`      - Día: ${f.dia || 'cualquiera'}`);
    console.log(`      - imageUrl: ${f.imageUrl ? '✅ TIENE' : '❌ NO TIENE'}`);
    console.log(`      - imageUrl value: "${f.imageUrl || 'null'}"`);
  });

  // 2. VERIFICAR DÍA COMERCIAL ACTUAL
  console.log('\n🗓️  2. DÍA COMERCIAL ACTUAL');
  console.log('-'.repeat(60));

  const now = new Date();
  const hour = now.getHours();
  let diaComercial;

  if (hour < 4) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
    console.log(`⏰ Hora actual: ${hour}:${now.getMinutes()} (ANTES de las 4 AM)`);
  } else {
    diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    console.log(`⏰ Hora actual: ${hour}:${now.getMinutes()} (DESPUÉS de las 4 AM)`);
  }

  console.log(`🏢 Día comercial calculado: "${diaComercial}"`);

  // 3. SIMULAR FILTRADO DE LA API
  console.log('\n🔍 3. SIMULACIÓN DE FILTRADO (como en route.ts)');
  console.log('-'.repeat(60));

  const shouldShowInDay = (item, day) => {
    return !item.dia || item.dia === day;
  };

  const bannersFiltrados = banners.filter(b => shouldShowInDay(b, diaComercial));
  const promocionesFiltradas = promociones.filter(p => shouldShowInDay(p, diaComercial));
  const favoritosFiltrados = favoritos.filter(f => shouldShowInDay(f, diaComercial));

  console.log(`\n📢 Banners filtrados por día: ${bannersFiltrados.length}/${banners.length}`);
  bannersFiltrados.forEach((b, i) => {
    console.log(`   ${i + 1}. "${b.title}" (día: ${b.dia || 'cualquiera'})`);
  });

  console.log(`\n🎁 Promociones filtradas por día: ${promocionesFiltradas.length}/${promociones.length}`);
  promocionesFiltradas.forEach((p, i) => {
    console.log(`   ${i + 1}. "${p.title}" (día: ${p.dia || 'cualquiera'})`);
  });

  console.log(`\n⭐ Favoritos filtrados por día: ${favoritosFiltrados.length}/${favoritos.length}`);
  favoritosFiltrados.forEach((f, i) => {
    console.log(`   ${i + 1}. "${f.productName}" (día: ${f.dia || 'cualquiera'})`);
  });

  // 4. SIMULAR FILTRADO POR ACTIVO
  console.log('\n✅ 4. FILTRADO POR ACTIVO');
  console.log('-'.repeat(60));

  const bannersActivos = bannersFiltrados.filter(b => b.active);
  const promocionesActivas = promocionesFiltradas.filter(p => p.active);
  const favoritosActivos = favoritosFiltrados.filter(f => f.active);

  console.log(`\n📢 Banners activos: ${bannersActivos.length}/${bannersFiltrados.length}`);
  bannersActivos.forEach((b, i) => {
    console.log(`   ${i + 1}. "${b.title}"`);
  });

  console.log(`\n🎁 Promociones activas: ${promocionesActivas.length}/${promocionesFiltradas.length}`);
  promocionesActivas.forEach((p, i) => {
    console.log(`   ${i + 1}. "${p.title}"`);
  });

  console.log(`\n⭐ Favoritos activos: ${favoritosActivos.length}/${favoritosFiltrados.length}`);
  favoritosActivos.forEach((f, i) => {
    console.log(`   ${i + 1}. "${f.productName}"`);
  });

  // 5. VERIFICAR TRANSFORMACIÓN A FORMATO CLIENTE
  console.log('\n🔄 5. TRANSFORMACIÓN A FORMATO CLIENTE (.map)');
  console.log('-'.repeat(60));

  const bannersTransformados = bannersActivos.map(b => ({
    id: b.id,
    titulo: b.title,
    descripcion: b.description || '',
    imagenUrl: b.imageUrl || '',
    dia: b.dia,
    activo: b.active
  }));

  const promocionesTransformadas = promocionesActivas.map(p => ({
    id: p.id,
    titulo: p.title,
    descripcion: p.description || '',
    imagenUrl: p.imageUrl || '',
    dia: p.dia,
    activo: p.active
  }));

  console.log(`\n📢 Banners transformados: ${bannersTransformados.length}`);
  bannersTransformados.forEach((b, i) => {
    console.log(`   ${i + 1}. "${b.titulo}"`);
    console.log(`      - imagenUrl: "${b.imagenUrl}"`);
    console.log(`      - imagenUrl.length: ${b.imagenUrl.length}`);
    console.log(`      - imagenUrl válida: ${b.imagenUrl && b.imagenUrl.trim() !== '' ? '✅' : '❌'}`);
  });

  console.log(`\n🎁 Promociones transformadas: ${promocionesTransformadas.length}`);
  promocionesTransformadas.forEach((p, i) => {
    console.log(`   ${i + 1}. "${p.titulo}"`);
    console.log(`      - imagenUrl: "${p.imagenUrl}"`);
    console.log(`      - imagenUrl.length: ${p.imagenUrl?.length || 0}`);
  });

  // 6. PROBAR FETCH A PRODUCCIÓN
  console.log('\n🌐 6. FETCH A PRODUCCIÓN (Vercel)');
  console.log('-'.repeat(60));

  try {
    const timestamp = Date.now();
    const prodUrl = `${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}&t=${timestamp}`;
    
    console.log(`📡 URL: ${prodUrl}`);
    console.log(`🔄 Haciendo fetch...`);

    const response = await fetch(prodUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const realData = data.data || data;

      console.log(`\n✅ Response OK (Status: ${response.status})`);
      console.log(`📊 Estructura de respuesta:`);
      console.log(`   - success: ${data.success}`);
      console.log(`   - data: ${!!data.data ? '✅ EXISTE' : '❌ NO EXISTE'}`);
      
      console.log(`\n📦 Arrays recibidos:`);
      console.log(`   - banners: ${realData.banners?.length || 0}`);
      console.log(`   - promociones: ${realData.promociones?.length || 0}`);
      console.log(`   - favoritoDelDia: ${realData.favoritoDelDia ? '✅ EXISTE' : '❌ NO EXISTE'}`);

      if (realData.banners?.length > 0) {
        console.log(`\n   📢 Banners en respuesta:`);
        realData.banners.forEach((b, i) => {
          console.log(`      ${i + 1}. "${b.titulo}"`);
          console.log(`         - imagenUrl: ${b.imagenUrl ? '✅' : '❌'}`);
          console.log(`         - imagenUrl value: "${b.imagenUrl || 'null'}"`);
        });
      }

      if (realData.promociones?.length > 0) {
        console.log(`\n   🎁 Promociones en respuesta:`);
        realData.promociones.forEach((p, i) => {
          console.log(`      ${i + 1}. "${p.titulo}"`);
          console.log(`         - imagenUrl: ${p.imagenUrl ? '✅' : '❌'}`);
          console.log(`         - imagenUrl value: "${p.imagenUrl || 'null'}"`);
        });
      }

      if (realData.favoritoDelDia) {
        console.log(`\n   ⭐ Favorito del día en respuesta:`);
        console.log(`      - productName: "${realData.favoritoDelDia.productName}"`);
        console.log(`      - imageUrl: ${realData.favoritoDelDia.imageUrl ? '✅' : '❌'}`);
        console.log(`      - imageUrl value: "${realData.favoritoDelDia.imageUrl || 'null'}"`);
      }

      // 7. COMPARACIÓN FINAL
      console.log('\n🎯 7. COMPARACIÓN: BD vs API');
      console.log('-'.repeat(60));

      const bdBanners = bannersActivos.length;
      const apiBanners = realData.banners?.length || 0;
      const bdPromociones = promocionesActivas.length;
      const apiPromociones = realData.promociones?.length || 0;

      console.log(`\n📢 BANNERS:`);
      console.log(`   BD (activos): ${bdBanners}`);
      console.log(`   API (recibidos): ${apiBanners}`);
      console.log(`   ¿Coinciden? ${bdBanners === apiBanners ? '✅' : '❌'}`);

      console.log(`\n🎁 PROMOCIONES:`);
      console.log(`   BD (activas): ${bdPromociones}`);
      console.log(`   API (recibidas): ${apiPromociones}`);
      console.log(`   ¿Coinciden? ${bdPromociones === apiPromociones ? '✅' : '❌'}`);

      // 8. DIAGNÓSTICO FINAL
      console.log('\n💡 8. DIAGNÓSTICO Y SOLUCIÓN');
      console.log('-'.repeat(60));

      if (bdBanners === apiBanners && bdPromociones === apiPromociones) {
        if (apiBanners === 0 && apiPromociones === 0) {
          console.log('⚠️  PROBLEMA: El filtrado está eliminando todos los elementos');
          console.log('   RAZÓN: Probablemente el día comercial no coincide con los elementos');
          console.log(`   DÍA COMERCIAL: "${diaComercial}"`);
          console.log(`   ELEMENTOS EN BD tienen día: "${banners[0]?.dia || 'null'}"`);
        } else if (apiBanners > 0 && apiPromociones === 0) {
          console.log('⚠️  PROBLEMA: Solo banners funcionan, promociones no');
          console.log('   REVISAR: Campo "dia" en promociones vs banners');
        } else {
          console.log('✅ API funciona correctamente');
          console.log('   Si no ves elementos en el cliente, el problema está en:');
          console.log('   1. El hook useAutoRefreshPortalConfig');
          console.log('   2. El filtrado en los componentes de React');
          console.log('   3. Cache del navegador');
        }
      } else {
        console.log('❌ PROBLEMA: Los arrays se están perdiendo en el fetch');
        console.log('   REVISAR: La estructura de respuesta de la API');
      }

    } else {
      console.log(`❌ Error en fetch: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`Respuesta: ${text}`);
    }

  } catch (error) {
    console.log(`❌ Error en fetch: ${error.message}`);
  }

  await prisma.$disconnect();
}

diagnosticar().catch(console.error);
