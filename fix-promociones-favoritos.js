#!/usr/bin/env node

/**
 * 🚀 SOLUCIÓN RÁPIDA: ARREGLAR PROMOCIONES Y FAVORITOS
 * 
 * PROBLEMAS IDENTIFICADOS:
 * 1. Promociones no tienen imágenes válidas
 * 2. Favoritos funcionan en la API pero pueden no renderizarse correctamente en el frontend
 * 
 * SOLUCIONES:
 * 1. Agregar imágenes a promociones existentes
 * 2. Verificar que favoritos tengan datos correctos
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function fixPromocionesYFavoritos() {
  console.log('🚀 ARREGLANDO PROMOCIONES Y FAVORITOS');
  console.log('='.repeat(50));
  
  try {
    // 1. ARREGLAR PROMOCIONES SIN IMAGEN
    console.log('\n🎁 1. ARREGLANDO PROMOCIONES');
    console.log('-'.repeat(35));
    
    const promocionesSinImagen = await prisma.portalPromocion.findMany({
      where: { 
        businessId: BUSINESS_ID,
        OR: [
          { imageUrl: null },
          { imageUrl: '' }
        ]
      }
    });
    
    console.log(`Promociones sin imagen encontradas: ${promocionesSinImagen.length}`);
    
    for (const promo of promocionesSinImagen) {
      const imageUrl = 'https://images.unsplash.com/photo-1563620660-3b1e3b1c6a4e?auto=format&fit=crop&w=500&q=80';
      
      await prisma.portalPromocion.update({
        where: { id: promo.id },
        data: { imageUrl }
      });
      
      console.log(`✅ Promoción "${promo.title}" actualizada con imagen`);
    }
    
    // 2. VERIFICAR FAVORITOS DEL DÍA
    console.log('\n⭐ 2. VERIFICANDO FAVORITOS DEL DÍA');
    console.log('-'.repeat(35));
    
    const favoritos = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: BUSINESS_ID, active: true }
    });
    
    console.log(`Favoritos activos encontrados: ${favoritos.length}`);
    
    favoritos.forEach(fav => {
      console.log(`   - "${fav.productName}" | Día: ${fav.dia} | IMG: ${fav.imageUrl ? '✅' : '❌'}`);
    });
    
    // 3. VERIFICAR QUE HAY FAVORITO PARA EL DÍA ACTUAL
    const now = new Date();
    const hour = now.getHours();
    let diaComercial;
    
    if (hour < 4) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][yesterday.getDay()];
    } else {
      diaComercial = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][now.getDay()];
    }
    
    console.log(`\n📅 Día comercial actual: ${diaComercial}`);
    
    const favoritoDelDia = favoritos.find(f => f.dia === diaComercial || !f.dia);
    
    if (!favoritoDelDia) {
      console.log('❌ No hay favorito para el día actual, creando uno...');
      
      const nuevoFavorito = await prisma.portalFavoritoDelDia.create({
        data: {
          businessId: BUSINESS_ID,
          productName: 'Plato Especial del Día',
          description: 'Nuestro plato más recomendado para hoy',
          imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=500&q=80',
          dia: diaComercial,
          active: true
        }
      });
      
      console.log(`✅ Favorito creado: "${nuevoFavorito.productName}" para ${diaComercial}`);
    } else {
      console.log(`✅ Ya hay favorito para ${diaComercial}: "${favoritoDelDia.productName}"`);
    }
    
    // 4. CREAR PROMOCIÓN PARA EL DÍA ACTUAL SI NO EXISTE
    console.log('\n🎁 3. VERIFICANDO PROMOCIÓN PARA HOY');
    console.log('-'.repeat(35));
    
    const promociones = await prisma.portalPromocion.findMany({
      where: { businessId: BUSINESS_ID, active: true }
    });
    
    const promocionDelDia = promociones.find(p => p.dia === diaComercial || !p.dia);
    
    if (!promocionDelDia) {
      console.log('❌ No hay promoción para el día actual, creando una...');
      
      const nuevaPromocion = await prisma.portalPromocion.create({
        data: {
          businessId: BUSINESS_ID,
          title: `Promoción Especial ${diaComercial.charAt(0).toUpperCase() + diaComercial.slice(1)}`,
          description: 'Descuento especial para clientes leales',
          discount: 15,
          imageUrl: 'https://images.unsplash.com/photo-1563620660-3b1e3b1c6a4e?auto=format&fit=crop&w=500&q=80',
          dia: diaComercial,
          active: true
        }
      });
      
      console.log(`✅ Promoción creada: "${nuevaPromocion.title}" para ${diaComercial}`);
    } else {
      console.log(`✅ Ya hay promoción para ${diaComercial}: "${promocionDelDia.title}"`);
      
      // Si la promoción no tiene imagen, agregarla
      if (!promocionDelDia.imageUrl) {
        await prisma.portalPromocion.update({
          where: { id: promocionDelDia.id },
          data: { 
            imageUrl: 'https://images.unsplash.com/photo-1563620660-3b1e3b1c6a4e?auto=format&fit=crop&w=500&q=80'
          }
        });
        console.log(`✅ Imagen agregada a promoción "${promocionDelDia.title}"`);
      }
    }
    
    // 5. VERIFICACIÓN FINAL
    console.log('\n✅ 4. VERIFICACIÓN FINAL');
    console.log('-'.repeat(25));
    
    const bannersFinales = await prisma.portalBanner.findMany({
      where: { businessId: BUSINESS_ID, active: true }
    });
    
    const promocionesFinales = await prisma.portalPromocion.findMany({
      where: { businessId: BUSINESS_ID, active: true }
    });
    
    const favoritosFinales = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: BUSINESS_ID, active: true }
    });
    
    const bannersConImagen = bannersFinales.filter(b => b.imageUrl);
    const promocionesConImagen = promocionesFinales.filter(p => p.imageUrl);
    const favoritosConImagen = favoritosFinales.filter(f => f.imageUrl);
    
    console.log(`📢 Banners con imagen: ${bannersConImagen.length}/${bannersFinales.length}`);
    console.log(`🎁 Promociones con imagen: ${promocionesConImagen.length}/${promocionesFinales.length}`);
    console.log(`⭐ Favoritos con imagen: ${favoritosConImagen.length}/${favoritosFinales.length}`);
    
    // Filtrar por día actual
    const bannersHoy = bannersConImagen.filter(b => !b.dia || b.dia === diaComercial);
    const promocionesHoy = promocionesConImagen.filter(p => !p.dia || p.dia === diaComercial);
    const favoritosHoy = favoritosConImagen.filter(f => !f.dia || f.dia === diaComercial);
    
    console.log(`\n📅 Contenido visible para ${diaComercial}:`);
    console.log(`📢 Banners: ${bannersHoy.length}`);
    console.log(`🎁 Promociones: ${promocionesHoy.length}`);
    console.log(`⭐ Favoritos: ${favoritosHoy.length}`);
    
    if (bannersHoy.length > 0 && promocionesHoy.length > 0 && favoritosHoy.length > 0) {
      console.log('\n🎉 ¡PERFECTO! AHORA TODOS LOS ELEMENTOS DEBERÍAN MOSTRARSE');
      console.log('📱 Ve al portal del cliente para verificar');
    } else {
      console.log('\n⚠️ Aún faltan elementos por configurar');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPromocionesYFavoritos().catch(console.error);
