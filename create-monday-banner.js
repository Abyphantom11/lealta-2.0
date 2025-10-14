// Script para crear un banner para el día actual (lunes) y verificar el filtro por día
const { PrismaClient } = require('@prisma/client');

async function createMondayBanner() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📅 CREANDO BANNER PARA HOY (LUNES)');
    console.log('='.repeat(50));
    
    const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
    
    // 1. Verificar banners existentes por día
    console.log('📊 1. Verificando banners por día...');
    
    const bannersPorDia = await prisma.portalBanner.groupBy({
      by: ['dia'],
      where: { businessId },
      _count: { dia: true }
    });
    
    console.log('   Banners por día:');
    bannersPorDia.forEach(group => {
      console.log(`   - ${group.dia}: ${group._count.dia} banner(s)`);
    });
    
    // 2. Verificar si ya hay banner para lunes
    const bannerLunes = await prisma.portalBanner.findFirst({
      where: { 
        businessId,
        dia: 'lunes',
        active: true
      }
    });
    
    if (bannerLunes) {
      console.log(`\n✅ Ya existe banner para lunes: "${bannerLunes.title}"`);
    } else {
      console.log('\n❌ NO hay banner para lunes. Creando uno...');
      
      // Crear banner para lunes
      const newBanner = await prisma.portalBanner.create({
        data: {
          businessId,
          title: 'Especial de Lunes - Casa Sabor',
          description: 'Gran inicio de semana con descuentos especiales',
          imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
          dia: 'lunes',
          active: true,
          orden: 0
        }
      });
      
      console.log(`✅ Banner de lunes creado: "${newBanner.title}" (${newBanner.id})`);
    }
    
    // 3. Verificar todos los banners activos
    console.log('\n📋 3. Banners activos después de la actualización:');
    
    const bannersActivos = await prisma.portalBanner.findMany({
      where: { 
        businessId,
        active: true
      },
      orderBy: { dia: 'asc' }
    });
    
    bannersActivos.forEach(banner => {
      console.log(`   - ${banner.dia}: "${banner.title}" (${banner.active ? 'activo' : 'inactivo'})`);
    });
    
    // 4. Simular el filtro que usa getBannersForBusinessDay
    console.log('\n🔍 4. Simulando filtro por día actual...');
    
    const hoy = 'lunes'; // Simular que hoy es lunes
    const bannersHoy = bannersActivos.filter(banner => banner.dia === hoy);
    
    console.log(`   Banners para ${hoy}: ${bannersHoy.length}`);
    bannersHoy.forEach(banner => {
      console.log(`      - "${banner.title}"`);
    });
    
    if (bannersHoy.length > 0) {
      console.log('\n🎉 ¡PERFECTO! Ahora hay banners para mostrar hoy');
      console.log('📱 El portal del cliente debería mostrar los banners');
    } else {
      console.log('\n⚠️ Aún no hay banners para el día actual');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMondayBanner().catch(console.error);
