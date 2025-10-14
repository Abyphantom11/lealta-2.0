#!/usr/bin/env node

/**
 * 🔍 VERIFICAR: BD vs APIs - ¿Se reflejan cambios del admin?
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function verifyBDvsAPIs() {
  console.log('🔍 VERIFICACIÓN: BD vs APIs - Cambios del Admin');
  console.log('='.repeat(60));
  
  try {
    // 1. DATOS DIRECTOS DE LA BD
    console.log('\n📊 1. DATOS DIRECTOS DE LA BASE DE DATOS');
    console.log('-'.repeat(50));
    
    const bannersBD = await prisma.portalBanner.findMany({
      where: { businessId: BUSINESS_ID },
      orderBy: { updatedAt: 'desc' }
    });
    
    const promocionesBD = await prisma.portalPromocion.findMany({
      where: { businessId: BUSINESS_ID },
      orderBy: { updatedAt: 'desc' }
    });
    
    const favoritosBD = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: BUSINESS_ID },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`📢 BANNERS en BD: ${bannersBD.length}`);
    bannersBD.forEach((b, i) => {
      console.log(`   ${i+1}. "${b.title}" | active: ${b.active} | imageUrl: ${b.imageUrl ? 'SÍ' : 'NO'} | updatedAt: ${b.updatedAt.toISOString()}`);
    });
    
    console.log(`\n🎁 PROMOCIONES en BD: ${promocionesBD.length}`);
    promocionesBD.forEach((p, i) => {
      console.log(`   ${i+1}. "${p.title}" | active: ${p.active} | imageUrl: ${p.imageUrl ? 'SÍ' : 'NO'} | updatedAt: ${p.updatedAt.toISOString()}`);
    });
    
    console.log(`\n⭐ FAVORITOS en BD: ${favoritosBD.length}`);
    favoritosBD.forEach((f, i) => {
      console.log(`   ${i+1}. "${f.productName}" | active: ${f.active} | imageUrl: ${f.imageUrl ? 'SÍ' : 'NO'} | updatedAt: ${f.updatedAt.toISOString()}`);
    });

    // 2. DATOS DE LA API config-v2 (LOCAL)
    console.log('\n📡 2. DATOS DE LA API config-v2 (simulando llamada)');
    console.log('-'.repeat(50));
    
    // Simular la misma lógica que usa config-v2
    const currentDayName = 'lunes'; // Día actual según análisis anterior
    
    // Filtrar por día comercial (igual que en config-v2)
    const shouldShowInDay = (item, day) => {
      return !item.dia || item.dia === day;
    };
    
    const bannersFiltrados = bannersBD.filter(banner => shouldShowInDay(banner, currentDayName));
    const promocionesFiltradas = promocionesBD.filter(promo => shouldShowInDay(promo, currentDayName));
    const favoritosFiltrados = favoritosBD.filter(fav => shouldShowInDay(fav, currentDayName));

    // Filtrar solo los activos (igual que en config-v2)
    const bannersActivos = bannersFiltrados.filter(b => b.active);
    const promocionesActivas = promocionesFiltradas.filter(p => p.active);
    const favoritosActivos = favoritosFiltrados.filter(f => f.active);

    console.log(`📢 Banners después de filtros config-v2: ${bannersActivos.length}`);
    bannersActivos.forEach((b, i) => {
      console.log(`   ${i+1}. "${b.title}" | imagenUrl transformada: ${b.imageUrl || ''}`);
    });
    
    console.log(`\n🎁 Promociones después de filtros config-v2: ${promocionesActivas.length}`);
    promocionesActivas.forEach((p, i) => {
      console.log(`   ${i+1}. "${p.title}" | imagenUrl transformada: ${p.imageUrl || ''}`);
    });
    
    console.log(`\n⭐ Favoritos después de filtros config-v2: ${favoritosActivos.length}`);
    favoritosActivos.forEach((f, i) => {
      console.log(`   ${i+1}. "${f.productName}" | imageUrl transformada: ${f.imageUrl || ''}`);
    });

    // 3. VERIFICAR ÚLTIMA MODIFICACIÓN
    console.log('\n⏰ 3. VERIFICACIÓN DE ÚLTIMA MODIFICACIÓN');
    console.log('-'.repeat(50));
    
    const allUpdates = [
      ...bannersBD.map(b => ({ type: 'Banner', title: b.title, updatedAt: b.updatedAt })),
      ...promocionesBD.map(p => ({ type: 'Promoción', title: p.title, updatedAt: p.updatedAt })),
      ...favoritosBD.map(f => ({ type: 'Favorito', title: f.productName, updatedAt: f.updatedAt }))
    ].sort((a, b) => b.updatedAt - a.updatedAt);
    
    console.log('🕐 Últimas modificaciones (más recientes primero):');
    allUpdates.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i+1}. ${item.type}: "${item.title}" - ${item.updatedAt.toISOString()}`);
    });

    // 4. DIAGNÓSTICO CRÍTICO
    console.log('\n🎯 4. DIAGNÓSTICO CRÍTICO');
    console.log('-'.repeat(50));
    
    const ahora = new Date();
    console.log(`⏰ Hora actual: ${ahora.toISOString()}`);
    
    if (bannersActivos.length > 0) {
      console.log('✅ BANNERS: Deberían mostrarse en el cliente');
    } else {
      console.log('❌ BANNERS: NO se mostrarán en el cliente');
      if (bannersBD.length === 0) {
        console.log('   💡 Causa: No hay banners en BD');
      } else if (bannersFiltrados.length === 0) {
        console.log('   💡 Causa: Ningún banner coincide con el día actual (lunes)');
      } else {
        console.log('   💡 Causa: Todos los banners están inactivos');
      }
    }
    
    if (promocionesActivas.length > 0) {
      console.log('✅ PROMOCIONES: Deberían mostrarse en el cliente');
    } else {
      console.log('❌ PROMOCIONES: NO se mostrarán en el cliente');
      if (promocionesBD.length === 0) {
        console.log('   💡 Causa: No hay promociones en BD');
      } else if (promocionesFiltradas.length === 0) {
        console.log('   💡 Causa: Ninguna promoción coincide con el día actual (lunes)');
      } else {
        console.log('   💡 Causa: Todas las promociones están inactivas');
      }
    }
    
    if (favoritosActivos.length > 0) {
      console.log('✅ FAVORITOS: Deberían mostrarse en el cliente');
    } else {
      console.log('❌ FAVORITOS: NO se mostrarán en el cliente');
      if (favoritosBD.length === 0) {
        console.log('   💡 Causa: No hay favoritos en BD');
      } else if (favoritosFiltrados.length === 0) {
        console.log('   💡 Causa: Ningún favorito coincide con el día actual (lunes)');
      } else {
        console.log('   💡 Causa: Todos los favoritos están inactivos');
      }
    }

    // 5. COMANDO PARA ARREGLAR
    console.log('\n🔧 5. COMANDOS PARA ARREGLAR');
    console.log('-'.repeat(50));
    
    if (promocionesActivas.length === 0 && promocionesBD.length > 0) {
      console.log('Para activar promociones existentes:');
      console.log('node create-promociones-favorito.js');
    }
    
    if (favoritosActivos.length === 0 && favoritosBD.length > 0) {
      console.log('Para activar favoritos existentes:');
      console.log('node create-promociones-favorito.js');
    }
    
  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBDvsAPIs().catch(console.error);
