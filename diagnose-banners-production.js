#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO COMPLETO: Banners en Producción
 * 
 * Este script simula el flujo completo de banners para diagnosticar
 * por qué no aparecen en producción, incluso para días específicos.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Configuración
const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds'; // Golom
const PRODUCTION_URL = 'https://lealta-2-0-six.vercel.app';

async function main() {
  console.log('🔍 DIAGNÓSTICO BANNERS EN PRODUCCIÓN');
  console.log('=====================================\n');
  
  try {
    // 1. VERIFICAR DATOS EN BASE DE DATOS
    console.log('📊 1. VERIFICANDO BANNERS EN BASE DE DATOS...');
    console.log('─'.repeat(50));
    
    const banners = await prisma.portalBanner.findMany({
      where: {
        businessId: BUSINESS_ID
      },
      orderBy: {
        orden: 'asc'
      }
    });
    
    console.log(`Total banners encontrados: ${banners.length}`);
    
    if (banners.length === 0) {
      console.log('❌ NO HAY BANNERS EN LA BASE DE DATOS');
      console.log('Necesitas crear banners primero en el admin panel\n');
      return;
    }
    
    banners.forEach((banner, idx) => {
      console.log(`\n${idx + 1}. Banner: "${banner.title}"`);
      console.log(`   📅 Día: ${banner.dia || 'Sin restricción'}`);
      console.log(`   ✅ Activo: ${banner.active}`);
      console.log(`   🖼️ Imagen: ${banner.imageUrl ? 'SÍ' : 'NO'}`);
      console.log(`   🔗 Link: ${banner.linkUrl || 'Sin link'}`);
      console.log(`   📝 Descripción: ${banner.description || 'Sin descripción'}`);
      console.log(`   📊 Orden: ${banner.orden}`);
      console.log(`   🕐 Creado: ${banner.createdAt.toISOString()}`);
    });
    
    const activeBanners = banners.filter(b => b.active);
    console.log(`\n✅ Banners activos: ${activeBanners.length}/${banners.length}`);
    
    // 2. SIMULAR DÍAS DE LA SEMANA
    console.log('\n📅 2. SIMULANDO FILTROS POR DÍA DE LA SEMANA...');
    console.log('─'.repeat(50));
    
    const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    
    for (const dia of diasSemana) {
      const bannersParaDia = activeBanners.filter(banner => {
        return !banner.dia || banner.dia === 'todos' || banner.dia.toLowerCase() === dia.toLowerCase();
      });
      
      console.log(`${dia.toUpperCase()}: ${bannersParaDia.length} banners`);
      bannersParaDia.forEach(b => {
        console.log(`  - "${b.title}" (día: ${b.dia || 'todos'})`);
      });
    }
    
    // 3. PROBAR API LOCAL
    console.log('\n🌐 3. PROBANDO API BANNERS (SIMULANDO PRODUCCIÓN)...');
    console.log('─'.repeat(50));
    
    // Simular diferentes escenarios
    const testCases = [
      { name: 'Sin query params', url: `/api/portal/banners` },
      { name: 'Con businessId query', url: `/api/portal/banners?businessId=${BUSINESS_ID}` },
      { name: 'Con timestamp', url: `/api/portal/banners?businessId=${BUSINESS_ID}&t=${Date.now()}` },
      { name: 'Con dayKey', url: `/api/portal/banners?businessId=${BUSINESS_ID}&dayKey=lunes-${new Date().toDateString()}` }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Probando: ${testCase.name}`);
      console.log(`URL: ${testCase.url}`);
      
      try {
        // Simular llamada a la API (necesitaremos usar fetch en un entorno real)
        console.log('   ⚡ Simulando llamada API...');
        console.log('   📋 Headers esperados:');
        console.log('      - x-business-id: (desde middleware)');
        console.log('      - user-agent: navegador');
        console.log('   📦 Query params:');
        const urlObj = new URL(testCase.url, 'http://localhost:3000');
        urlObj.searchParams.forEach((value, key) => {
          console.log(`      - ${key}: ${value}`);
        });
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // 4. VERIFICAR LÓGICA DE DÍA COMERCIAL
    console.log('\n🕐 4. VERIFICANDO LÓGICA DE DÍA COMERCIAL...');
    console.log('─'.repeat(50));
    
    const now = new Date();
    const hour = now.getHours();
    console.log(`Hora actual: ${hour}:${now.getMinutes()}`);
    
    // Lógica actual de día comercial
    let diaComercial;
    if (hour < 4) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
      console.log(`⏰ Antes de las 4 AM - Día comercial: ${diaComercial} (ayer)`);
    } else {
      diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
      console.log(`⏰ Después de las 4 AM - Día comercial: ${diaComercial} (hoy)`);
    }
    
    // Banners que deberían mostrarse
    const bannersParaHoy = activeBanners.filter(banner => {
      return !banner.dia || banner.dia === 'todos' || banner.dia.toLowerCase() === diaComercial.toLowerCase();
    });
    
    console.log(`\n🎯 Banners que DEBERÍAN mostrarse hoy (${diaComercial}): ${bannersParaHoy.length}`);
    bannersParaHoy.forEach(b => {
      console.log(`  ✅ "${b.title}" (día: ${b.dia || 'todos'})`);
    });
    
    // 5. CREAR BANNER DE PRUEBA SI NO HAY
    if (activeBanners.length === 0) {
      console.log('\n🔧 5. CREANDO BANNER DE PRUEBA...');
      console.log('─'.repeat(50));
      
      const testBanner = await prisma.portalBanner.create({
        data: {
          businessId: BUSINESS_ID,
          title: 'Banner de Prueba - Diagnóstico',
          description: 'Banner creado automáticamente para diagnóstico',
          imageUrl: 'https://via.placeholder.com/800x400/0066cc/ffffff?text=Banner+de+Prueba',
          linkUrl: '#',
          dia: null, // Sin restricción de día
          active: true,
          orden: 1
        }
      });
      
      console.log(`✅ Banner de prueba creado con ID: ${testBanner.id}`);
    }
    
    // 6. INSTRUCCIONES PARA PROBAR EN PRODUCCIÓN
    console.log('\n🚀 6. INSTRUCCIONES PARA PROBAR EN PRODUCCIÓN');
    console.log('─'.repeat(50));
    console.log(`\n📋 URLs para probar manualmente:`);
    console.log(`1. API directa: ${PRODUCTION_URL}/api/portal/banners?businessId=${BUSINESS_ID}`);
    console.log(`2. Config v2: ${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}`);
    console.log(`3. Portal cliente: ${PRODUCTION_URL}/${BUSINESS_ID}/cliente`);
    
    console.log(`\n🔧 Headers para incluir en las pruebas:`);
    console.log(`- x-business-id: ${BUSINESS_ID}`);
    console.log(`- cache-control: no-cache`);
    
    console.log(`\n💡 Comandos curl para probar:`);
    console.log(`curl -H "x-business-id: ${BUSINESS_ID}" "${PRODUCTION_URL}/api/portal/banners?businessId=${BUSINESS_ID}"`);
    console.log(`curl -H "x-business-id: ${BUSINESS_ID}" "${PRODUCTION_URL}/api/portal/config-v2?businessId=${BUSINESS_ID}"`);
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
