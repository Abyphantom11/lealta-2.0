#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO COMPLETO: Requisitos para mostrar elementos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function analyzeRequirements() {
  console.log('🔍 ANÁLISIS DE REQUISITOS PARA MOSTRAR ELEMENTOS');
  console.log('='.repeat(60));
  
  try {
    // 1. VERIFICAR DATOS RAW EN BD
    console.log('\n📊 1. DATOS RAW EN BASE DE DATOS');
    console.log('-'.repeat(40));
    
    const banners = await prisma.portalBanner.findMany({
      where: { businessId: BUSINESS_ID },
      select: { 
        id: true, 
        title: true, 
        active: true, 
        imageUrl: true, 
        dia: true,
        orden: true 
      }
    });
    
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId: BUSINESS_ID },
      select: { 
        id: true, 
        title: true, 
        active: true, 
        imageUrl: true, 
        dia: true,
        validUntil: true 
      }
    });
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: BUSINESS_ID },
      select: { 
        id: true, 
        productName: true, 
        active: true, 
        imageUrl: true, 
        dia: true 
      }
    });
    
    console.log(`📢 BANNERS (${banners.length} total):`);
    banners.forEach((b, i) => {
      const activo = b.active ? '✅' : '❌';
      const imagen = (b.imageUrl && b.imageUrl.trim()) ? '✅' : '❌';
      const pasaFiltro = b.active && b.imageUrl && b.imageUrl.trim() !== '';
      console.log(`   ${i+1}. "${b.title}" | Activo: ${activo} | Imagen: ${imagen} | Día: ${b.dia || 'null'} | PASA FILTRO: ${pasaFiltro ? '✅' : '❌'}`);
    });
    
    console.log(`\n🎁 PROMOCIONES (${promociones.length} total):`);
    promociones.forEach((p, i) => {
      const activo = p.active ? '✅' : '❌';
      const imagen = (p.imageUrl && p.imageUrl.trim()) ? '✅' : '❌';
      const vigente = !p.validUntil || p.validUntil >= new Date();
      const pasaFiltro = p.active && p.imageUrl && p.imageUrl.trim() !== '' && vigente;
      console.log(`   ${i+1}. "${p.title}" | Activo: ${activo} | Imagen: ${imagen} | Día: ${p.dia || 'null'} | Vigente: ${vigente ? '✅' : '❌'} | PASA FILTRO: ${pasaFiltro ? '✅' : '❌'}`);
    });
    
    console.log(`\n⭐ FAVORITOS (${favoritos.length} total):`);
    favoritos.forEach((f, i) => {
      const activo = f.active ? '✅' : '❌';
      const imagen = (f.imageUrl && f.imageUrl.trim()) ? '✅' : '❌';
      const pasaFiltro = f.active && f.imageUrl && f.imageUrl.trim() !== '';
      console.log(`   ${i+1}. "${f.productName}" | Activo: ${activo} | Imagen: ${imagen} | Día: ${f.dia || 'null'} | PASA FILTRO: ${pasaFiltro ? '✅' : '❌'}`);
    });
    
    // 2. CONTAR ELEMENTOS QUE PASAN FILTROS
    console.log('\n📋 2. RESUMEN DE FILTROS');
    console.log('-'.repeat(40));
    
    const bannersQuePasan = banners.filter(b => 
      b.active && b.imageUrl && b.imageUrl.trim() !== ''
    );
    
    const promocionesQuePasan = promociones.filter(p => 
      p.active && 
      p.imageUrl && 
      p.imageUrl.trim() !== '' && 
      (!p.validUntil || p.validUntil >= new Date())
    );
    
    const favoritosQuePasan = favoritos.filter(f => 
      f.active && f.imageUrl && f.imageUrl.trim() !== ''
    );
    
    console.log(`📢 Banners que pasan filtro: ${bannersQuePasan.length}/${banners.length}`);
    console.log(`🎁 Promociones que pasan filtro: ${promocionesQuePasan.length}/${promociones.length}`);
    console.log(`⭐ Favoritos que pasan filtro: ${favoritosQuePasan.length}/${favoritos.length}`);
    
    // 3. SIMULACIÓN DE DÍA COMERCIAL
    console.log('\n📅 3. VERIFICACIÓN DE DÍA COMERCIAL');
    console.log('-'.repeat(40));
    
    const now = new Date();
    const hour = now.getHours();
    let diaComercial;
    
    if (hour < 4) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
      console.log(`⏰ Antes de las 4 AM (hora actual: ${hour}:${now.getMinutes()})`);
    } else {
      diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
      console.log(`⏰ Después de las 4 AM (hora actual: ${hour}:${now.getMinutes()})`);
    }
    
    console.log(`🗓️ Día comercial actual: ${diaComercial}`);
    
    // Filtrar por día
    const bannersFinalFiltered = bannersQuePasan.filter(b => 
      !b.dia || b.dia === 'todos' || b.dia.toLowerCase() === diaComercial.toLowerCase()
    );
    
    const promocionesFinalFiltered = promocionesQuePasan.filter(p => 
      !p.dia || p.dia === 'todos' || p.dia.toLowerCase() === diaComercial.toLowerCase()
    );
    
    const favoritosFinalFiltered = favoritosQuePasan.filter(f => 
      !f.dia || f.dia === 'todos' || f.dia.toLowerCase() === diaComercial.toLowerCase()
    );
    
    console.log(`📢 Banners finales (con día): ${bannersFinalFiltered.length}/${bannersQuePasan.length}`);
    console.log(`🎁 Promociones finales (con día): ${promocionesFinalFiltered.length}/${promocionesQuePasan.length}`);
    console.log(`⭐ Favoritos finales (con día): ${favoritosFinalFiltered.length}/${favoritosQuePasan.length}`);
    
    // 4. DIAGNOSIS FINAL
    console.log('\n🎯 4. DIAGNÓSTICO FINAL');
    console.log('-'.repeat(40));
    
    if (bannersFinalFiltered.length === 0) {
      console.log('❌ BANNERS: No hay banners que cumplan todos los requisitos');
      console.log('   Requisitos: active=true + imageUrl válida + (sin día específico O día coincide)');
    } else {
      console.log(`✅ BANNERS: ${bannersFinalFiltered.length} banners deberían mostrarse`);
    }
    
    if (promocionesFinalFiltered.length === 0) {
      console.log('❌ PROMOCIONES: No hay promociones que cumplan todos los requisitos');
      console.log('   Requisitos: active=true + imageUrl válida + vigente + (sin día específico O día coincide)');
    } else {
      console.log(`✅ PROMOCIONES: ${promocionesFinalFiltered.length} promociones deberían mostrarse`);
    }
    
    if (favoritosFinalFiltered.length === 0) {
      console.log('❌ FAVORITOS: No hay favoritos que cumplan todos los requisitos');
      console.log('   Requisitos: active=true + imageUrl válida + (sin día específico O día coincide)');
    } else {
      console.log(`✅ FAVORITOS: ${favoritosFinalFiltered.length} favoritos deberían mostrarse`);
    }
    
    // 5. SOLUCIONES ESPECÍFICAS
    console.log('\n🔧 5. SOLUCIONES ESPECÍFICAS');
    console.log('-'.repeat(40));
    
    if (banners.length === 0) {
      console.log('🔨 Para banners: Crear banners desde el admin');
    } else if (bannersQuePasan.length === 0) {
      console.log('🔨 Para banners: Asegurar que tengan active=true e imageUrl válida');
    } else if (bannersFinalFiltered.length === 0) {
      console.log(`🔨 Para banners: Cambiar el día a "${diaComercial}" o quitar restricción de día`);
    }
    
    if (promociones.length === 0) {
      console.log('🔨 Para promociones: Crear promociones desde el admin');
    } else if (promocionesQuePasan.length === 0) {
      console.log('🔨 Para promociones: Asegurar que tengan active=true, imageUrl válida y estén vigentes');
    } else if (promocionesFinalFiltered.length === 0) {
      console.log(`🔨 Para promociones: Cambiar el día a "${diaComercial}" o quitar restricción de día`);
    }
    
    if (favoritos.length === 0) {
      console.log('🔨 Para favoritos: Crear favoritos desde el admin');
    } else if (favoritosQuePasan.length === 0) {
      console.log('🔨 Para favoritos: Asegurar que tengan active=true e imageUrl válida');
    } else if (favoritosFinalFiltered.length === 0) {
      console.log(`🔨 Para favoritos: Cambiar el día a "${diaComercial}" o quitar restricción de día`);
    }
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeRequirements().catch(console.error);
