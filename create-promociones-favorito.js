// Script para crear promociones y favorito del día para lunes
const { PrismaClient } = require('@prisma/client');

async function createPromocionesYFavorito() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎯 CREANDO PROMOCIONES Y FAVORITO DEL DÍA PARA LUNES');
    console.log('='.repeat(60));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
    
    // 1. Verificar promociones existentes para lunes
    console.log('📊 1. Verificando promociones existentes...');
    
    const promocionLunes = await prisma.portalPromocion.findFirst({
      where: { 
        businessId,
        dia: 'lunes',
        active: true
      }
    });
    
    if (promocionLunes) {
      console.log(`✅ Ya existe promoción para lunes: "${promocionLunes.title}"`);
    } else {
      console.log('❌ NO hay promoción para lunes. Creando una...');
      
      const newPromocion = await prisma.portalPromocion.create({
        data: {
          businessId,
          title: 'Descuento Lunes Feliz',
          description: '20% de descuento en todas las bebidas para empezar bien la semana',
          discount: '20',
          dia: 'lunes',
          active: true,
          orden: 0
        }
      });
      
      console.log(`✅ Promoción de lunes creada: "${newPromocion.title}" (${newPromocion.id})`);
    }
    
    // 2. Verificar favorito del día para lunes
    console.log('\n📊 2. Verificando favorito del día...');
    
    const favoritoLunes = await prisma.portalFavoritoDelDia.findFirst({
      where: { 
        businessId,
        dia: 'lunes',
        active: true
      }
    });
    
    if (favoritoLunes) {
      console.log(`✅ Ya existe favorito del día para lunes`);
    } else {
      console.log('❌ NO hay favorito del día para lunes. Creando uno...');
      
      const newFavorito = await prisma.portalFavoritoDelDia.create({
        data: {
          businessId,
          dia: 'lunes',
          productName: 'Café Especial del Lunes',
          imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
          active: true
        }
      });
      
      console.log(`✅ Favorito del día de lunes creado: ${newFavorito.id}`);
    }
    
    // 3. Verificar el resultado final
    console.log('\n📋 3. Verificando datos completos para lunes...');
    
    const bannersLunes = await prisma.portalBanner.count({
      where: { businessId, dia: 'lunes', active: true }
    });
    
    const promocionesLunes = await prisma.portalPromocion.count({
      where: { businessId, dia: 'lunes', active: true }
    });
    
    const favoritosLunes = await prisma.portalFavoritoDelDia.count({
      where: { businessId, dia: 'lunes', active: true }
    });
    
    console.log(`   ✅ Banners para lunes: ${bannersLunes}`);
    console.log(`   ✅ Promociones para lunes: ${promocionesLunes}`);
    console.log(`   ✅ Favoritos del día para lunes: ${favoritosLunes}`);
    
    if (bannersLunes > 0 && promocionesLunes > 0 && favoritosLunes > 0) {
      console.log('\n🎉 ¡PERFECTO! Datos completos para lunes');
      console.log('📱 El portal del cliente debería mostrar:');
      console.log('   - Banners ✅');
      console.log('   - Promociones ✅');
      console.log('   - Favorito del día ✅');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPromocionesYFavorito().catch(console.error);
