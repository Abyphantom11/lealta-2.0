#!/usr/bin/env node

/**
 * 🔍 COMPARAR: BD Local vs BD Producción
 */

const businessId = 'cmgf5px5f0000eyy0elci9yds';

async function compareBDs() {
  console.log('🔍 COMPARACIÓN: BD LOCAL vs BD PRODUCCIÓN');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar si el business existe en producción
    console.log('\n🏢 1. VERIFICAR BUSINESS EN PRODUCCIÓN');
    console.log('-'.repeat(40));
    
    const businessResponse = await fetch(`https://lealta.vercel.app/api/businesses/${businessId}/validate`);
    
    if (businessResponse.ok) {
      const businessData = await businessResponse.json();
      console.log('✅ Business encontrado en producción:');
      console.log(`   ID: ${businessData.id}`);
      console.log(`   Name: ${businessData.name}`);
    } else {
      console.log('❌ Business NO encontrado en producción');
      const errorText = await businessResponse.text();
      console.log(`Error: ${errorText}`);
      return;
    }
    
    // 2. Crear datos de prueba en producción usando APIs
    console.log('\n🔧 2. CREAR DATOS DE PRUEBA EN PRODUCCIÓN');
    console.log('-'.repeat(40));
    
    console.log('⚠️  IMPORTANTE: Para resolver esto necesitamos:');
    console.log('1. Ejecutar el script create-real-admin-data.js en producción');
    console.log('2. O usar el admin panel para crear banners/promociones/favoritos');
    console.log('3. O hacer una migración de datos de desarrollo a producción');
    
    // 3. Mostrar lo que falta
    console.log('\n📋 3. LO QUE FALTA EN PRODUCCIÓN');
    console.log('-'.repeat(40));
    
    console.log('En BD local tenemos:');
    console.log('✅ 1 Banner: "dfsf" (día: lunes, activo: true, con imagen)');
    console.log('✅ 1 Promoción: "asd" (día: lunes, activo: true, sin imagen)');
    console.log('✅ 1 Favorito: "fsdf" (día: lunes, activo: true, con imagen)');
    
    console.log('\nEn BD producción tenemos:');
    console.log('❌ 0 Banners');
    console.log('❌ 0 Promociones');
    console.log('❌ 0 Favoritos');
    
    // 4. Soluciones
    console.log('\n🎯 4. SOLUCIONES INMEDIATAS');
    console.log('-'.repeat(40));
    
    console.log('Opción A: Crear datos manualmente en admin de producción');
    console.log(`   URL: https://lealta.vercel.app/${businessId}/admin`);
    
    console.log('\nOpción B: Ejecutar script de datos de prueba:');
    console.log('   node create-real-admin-data.js');
    
    console.log('\nOpción C: Quitar filtros temporalmente para probar:');
    console.log('   Cambiar "dia: lunes" por "dia: null" en BD');
    
  } catch (error) {
    console.error('❌ Error en comparación:', error.message);
  }
}

compareBDs().catch(console.error);
