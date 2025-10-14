#!/usr/bin/env node

/**
 * 🔧 SOLUCIÓN TEMPORAL: CREAR ELEMENTOS PARA EL DÍA ACTUAL
 * 
 * Como las APIs devuelven elementos para "martes", vamos a crear
 * elementos específicos para "lunes" para probar la lógica
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

async function crearElementosParaLunes() {
  console.log('🔧 CREANDO ELEMENTOS PARA LUNES');
  console.log('='.repeat(40));
  
  try {
    // 1. VERIFICAR QUE ELEMENTOS EXISTEN PARA LUNES
    console.log('\n📊 1. VERIFICANDO ELEMENTOS PARA LUNES');
    console.log('-'.repeat(45));
    
    const bannersLunes = await prisma.portalBanner.findMany({
      where: { businessId: BUSINESS_ID, dia: 'lunes', active: true }
    });
    
    const promocionesLunes = await prisma.portalPromocion.findMany({
      where: { businessId: BUSINESS_ID, dia: 'lunes', active: true }
    });
    
    const favoritosLunes = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: BUSINESS_ID, dia: 'lunes', active: true }
    });
    
    console.log(`📢 Banners para lunes: ${bannersLunes.length}`);
    bannersLunes.forEach(b => {
      console.log(`   - "${b.title}" | IMG: ${b.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`🎁 Promociones para lunes: ${promocionesLunes.length}`);
    promocionesLunes.forEach(p => {
      console.log(`   - "${p.title}" | IMG: ${p.imageUrl ? '✅' : '❌'}`);
    });
    
    console.log(`⭐ Favoritos para lunes: ${favoritosLunes.length}`);
    favoritosLunes.forEach(f => {
      console.log(`   - "${f.productName}" | IMG: ${f.imageUrl ? '✅' : '❌'}`);
    });
    
    // 2. CREAR ELEMENTOS ADICIONALES SI ES NECESARIO
    let elementosCreados = 0;
    
    if (bannersLunes.length === 0) {
      console.log('\n❌ No hay banners para lunes, creando uno...');
      
      const nuevoBanner = await prisma.portalBanner.create({
        data: {
          businessId: BUSINESS_ID,
          title: 'Banner Especial Lunes',
          description: 'Promoción especial para empezar la semana',
          imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80',
          dia: 'lunes',
          active: true,
          orden: 0
        }
      });
      
      console.log(`✅ Banner creado: "${nuevoBanner.title}"`);
      elementosCreados++;
    }
    
    if (promocionesLunes.filter(p => p.imageUrl).length === 0) {
      console.log('\n❌ No hay promociones con imagen para lunes, creando una...');
      
      const nuevaPromocion = await prisma.portalPromocion.create({
        data: {
          businessId: BUSINESS_ID,
          title: 'Promoción Lunes Especial',
          description: 'Descuento especial para empezar la semana',
          discount: '20%',
          imageUrl: 'https://images.unsplash.com/photo-1563620660-3b1e3b1c6a4e?auto=format&fit=crop&w=500&q=80',
          dia: 'lunes',
          active: true,
          orden: 0
        }
      });
      
      console.log(`✅ Promoción creada: "${nuevaPromocion.title}"`);
      elementosCreados++;
    }
    
    if (favoritosLunes.filter(f => f.imageUrl).length === 0) {
      console.log('\n❌ No hay favoritos con imagen para lunes, creando uno...');
      
      const nuevoFavorito = await prisma.portalFavoritoDelDia.create({
        data: {
          businessId: BUSINESS_ID,
          productName: 'Plato Especial Lunes',
          description: 'Nuestro plato estrella para empezar la semana',
          imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=500&q=80',
          dia: 'lunes',
          active: true
        }
      });
      
      console.log(`✅ Favorito creado: "${nuevoFavorito.productName}"`);
      elementosCreados++;
    }
    
    // 3. VERIFICACIÓN FINAL
    console.log('\n✅ 3. VERIFICACIÓN FINAL');
    console.log('-'.repeat(25));
    
    const bannersLunesFinal = await prisma.portalBanner.findMany({
      where: { businessId: BUSINESS_ID, dia: 'lunes', active: true, NOT: { imageUrl: null } }
    });
    
    const promocionesLunesFinal = await prisma.portalPromocion.findMany({
      where: { businessId: BUSINESS_ID, dia: 'lunes', active: true, NOT: { imageUrl: null } }
    });
    
    const favoritosLunesFinal = await prisma.portalFavoritoDelDia.findMany({
      where: { businessId: BUSINESS_ID, dia: 'lunes', active: true, NOT: { imageUrl: null } }
    });
    
    console.log(`📢 Banners para lunes con imagen: ${bannersLunesFinal.length}`);
    console.log(`🎁 Promociones para lunes con imagen: ${promocionesLunesFinal.length}`);
    console.log(`⭐ Favoritos para lunes con imagen: ${favoritosLunesFinal.length}`);
    
    const totalElementosLunes = bannersLunesFinal.length + promocionesLunesFinal.length + favoritosLunesFinal.length;
    
    if (totalElementosLunes >= 3) {
      console.log('\n🎉 ¡PERFECTO! Ahora hay elementos completos para lunes');
      console.log('📱 Hora actual: 1:50 AM = día comercial "lunes"');
      console.log('✅ Deberían aparecer todos los elementos en el portal');
      
      if (elementosCreados > 0) {
        console.log(`✅ Se crearon ${elementosCreados} elementos nuevos`);
        console.log('⏰ Espera 1-2 minutos para que se actualice en producción');
      }
    } else {
      console.log('\n⚠️ Aún faltan elementos para lunes');
    }
    
    // 4. INSTRUCCIONES PARA PROBAR
    console.log('\n📱 4. CÓMO PROBAR AHORA');
    console.log('-'.repeat(25));
    console.log('Ve a la API y verifica que ahora devuelve elementos para lunes:');
    console.log('https://lealta.vercel.app/api/portal/config-v2?businessId=' + BUSINESS_ID);
    console.log('\nEsperas ver:');
    console.log(`- banners: ${bannersLunesFinal.length} elemento(s)`);
    console.log(`- promociones: ${promocionesLunesFinal.length} elemento(s)`);
    console.log(`- favoritoDelDia: ${favoritosLunesFinal.length > 0 ? 'SÍ' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearElementosParaLunes().catch(console.error);
