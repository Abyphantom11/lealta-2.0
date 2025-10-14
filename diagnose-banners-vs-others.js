#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO ESPECÍFICO: POR QUÉ BANNERS FUNCIONAN PERO PROMOCIONES Y FAVORITOS NO
 * 
 * Los banners se muestran en producción, pero promociones y favorito del día no.
 * Este script identifica las diferencias específicas.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function diagnoseBannersVsOthers() {
  console.log('🔍 ANÁLISIS: ¿POR QUÉ BANNERS FUNCIONAN Y OTROS NO?');
  console.log('='.repeat(65));
  
  try {
    // 1. VERIFICAR DATOS EN BD
    console.log('\n📊 1. DATOS EN BASE DE DATOS');
    console.log('-'.repeat(35));
    
    const banners = await prisma.portalBanner.findMany({
      where: { businessId: BUSINESS_ID, active: true },
      select: { id: true, title: true, dia: true, imageUrl: true, active: true }
    });
    
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId: BUSINESS_ID, active: true },
      select: { id: true, title: true, dia: true, imageUrl: true, active: true }
    });
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: BUSINESS_ID, active: true },
      select: { id: true, productName: true, dia: true, imageUrl: true, active: true }
    });
    
    console.log(`📢 Banners activos: ${banners.length}`);
    banners.forEach(b => {
      console.log(`   - "${b.title}" | Día: ${b.dia} | IMG: ${b.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`🎁 Promociones activas: ${promociones.length}`);
    promociones.forEach(p => {
      console.log(`   - "${p.title}" | Día: ${p.dia} | IMG: ${p.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`⭐ Favoritos activos: ${favoritos.length}`);
    favoritos.forEach(f => {
      console.log(`   - "${f.productName}" | Día: ${f.dia} | IMG: ${f.imageUrl ? '✅' : '❌'}`);
    });
    
    // 2. ANÁLISIS COMPARATIVO
    console.log('\n🔍 2. ANÁLISIS COMPARATIVO');
    console.log('-'.repeat(35));
    
    const bannersConImagen = banners.filter(b => b.imageUrl && b.imageUrl.trim() !== '');
    const promocionesConImagen = promociones.filter(p => p.imageUrl && p.imageUrl.trim() !== '');
    const favoritosConImagen = favoritos.filter(f => f.imageUrl && f.imageUrl.trim() !== '');
    
    console.log(`📢 Banners con imagen válida: ${bannersConImagen.length}/${banners.length}`);
    console.log(`🎁 Promociones con imagen válida: ${promocionesConImagen.length}/${promociones.length}`);
    console.log(`⭐ Favoritos con imagen válida: ${favoritosConImagen.length}/${favoritos.length}`);
    
    // 3. IDENTIFICAR EL PROBLEMA PRINCIPAL
    console.log('\n🚨 3. PROBLEMA IDENTIFICADO');
    console.log('-'.repeat(35));
    
    if (promocionesConImagen.length === 0) {
      console.log('❌ PROMOCIONES: Ninguna tiene imagen válida');
      console.log('   📝 Esto explica por qué no aparecen en el cliente');
      console.log('   💡 Los componentes filtran items sin imagen');
    } else {
      console.log('✅ PROMOCIONES: Tienen imágenes válidas');
    }
    
    if (favoritosConImagen.length === 0) {
      console.log('❌ FAVORITOS: Ninguno tiene imagen válida');
      console.log('   📝 Esto explica por qué no aparecen en el cliente');
      console.log('   💡 Los componentes filtran items sin imagen');
    } else {
      console.log('✅ FAVORITOS: Tienen imágenes válidas');
    }
    
    // 4. VERIFICAR DÍA COMERCIAL
    console.log('\n📅 4. VERIFICACIÓN DE DÍA COMERCIAL');
    console.log('-'.repeat(45));
    
    const now = new Date();
    const hour = now.getHours();
    let diaComercial;
    
    if (hour < 4) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
      console.log(`⏰ Antes de las 4 AM - Día comercial: ${diaComercial}`);
    } else {
      diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
      console.log(`⏰ Después de las 4 AM - Día comercial: ${diaComercial}`);
    }
    
    // Filtrar por día comercial
    const bannersDelDia = bannersConImagen.filter(b => !b.dia || b.dia === diaComercial);
    const promocionesDelDia = promocionesConImagen.filter(p => !p.dia || p.dia === diaComercial);
    const favoritosDelDia = favoritosConImagen.filter(f => !f.dia || f.dia === diaComercial);
    
    console.log(`📢 Banners para ${diaComercial}: ${bannersDelDia.length}`);
    console.log(`🎁 Promociones para ${diaComercial}: ${promocionesDelDia.length}`);
    console.log(`⭐ Favoritos para ${diaComercial}: ${favoritosDelDia.length}`);
    
    // 5. CONCLUSIONES Y SOLUCIONES
    console.log('\n🎯 5. CONCLUSIONES Y SOLUCIONES');
    console.log('-'.repeat(45));
    
    if (bannersDelDia.length > 0 && (promocionesDelDia.length === 0 || favoritosDelDia.length === 0)) {
      console.log('🔍 PROBLEMA IDENTIFICADO:');
      
      if (promocionesDelDia.length === 0) {
        if (promociones.length === 0) {
          console.log('   ❌ No hay promociones en la BD');
          console.log('   💡 SOLUCIÓN: Crear promociones desde el admin');
        } else if (promocionesConImagen.length === 0) {
          console.log('   ❌ Las promociones no tienen imágenes válidas');
          console.log('   💡 SOLUCIÓN: Subir imágenes a las promociones existentes');
        } else {
          console.log('   ❌ Las promociones no coinciden con el día actual');
          console.log('   💡 SOLUCIÓN: Crear promociones para el día actual o sin restricción de día');
        }
      }
      
      if (favoritosDelDia.length === 0) {
        if (favoritos.length === 0) {
          console.log('   ❌ No hay favoritos del día en la BD');
          console.log('   💡 SOLUCIÓN: Crear favoritos del día desde el admin');
        } else if (favoritosConImagen.length === 0) {
          console.log('   ❌ Los favoritos no tienen imágenes válidas');
          console.log('   💡 SOLUCIÓN: Subir imágenes a los favoritos existentes');
        } else {
          console.log('   ❌ Los favoritos no coinciden con el día actual');
          console.log('   💡 SOLUCIÓN: Crear favoritos para el día actual o sin restricción de día');
        }
      }
    } else if (bannersDelDia.length === 0 && promocionesDelDia.length === 0 && favoritosDelDia.length === 0) {
      console.log('❌ NINGÚN CONTENIDO VISIBLE:');
      console.log('   📝 Todos los elementos están filtrados');
      console.log('   💡 SOLUCIÓN: Verificar imágenes y días asignados');
    } else {
      console.log('✅ TODOS LOS ELEMENTOS DEBERÍAN SER VISIBLES:');
      console.log('   📝 El problema puede estar en el frontend o en la API');
      console.log('   💡 SOLUCIÓN: Verificar logs de producción y consola del navegador');
    }
    
    // 6. COMANDOS PARA ARREGLAR
    console.log('\n🔧 6. COMANDOS PARA ARREGLAR RÁPIDAMENTE');
    console.log('-'.repeat(50));
    
    if (promocionesConImagen.length === 0 && promociones.length > 0) {
      console.log('Para arreglar promociones sin imagen:');
      console.log('node create-promociones-favorito.js');
    }
    
    if (favoritosConImagen.length === 0 && favoritos.length > 0) {
      console.log('Para arreglar favoritos sin imagen:');
      console.log('node create-promociones-favorito.js');
    }
    
    if (promociones.length === 0) {
      console.log('Para crear promociones nuevas:');
      console.log('node create-real-admin-data.js');
    }
    
    if (favoritos.length === 0) {
      console.log('Para crear favoritos nuevos:');
      console.log('node create-real-admin-data.js');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseBannersVsOthers().catch(console.error);
