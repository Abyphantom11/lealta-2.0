#!/usr/bin/env node

/**
 * Test para verificar sincronización de banners admin → cliente
 * Verifica que los banners se guarden en BD y aparezcan en la vista previa
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBannersSync() {
  console.log('🧪 TESTING BANNER SYNCHRONIZATION');
  console.log('='.repeat(50));
  
  try {
    // Obtener todos los business disponibles
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true
      },
      take: 5
    });
    
    console.log(`📊 Businesses encontrados: ${businesses.length}`);
    
    for (const business of businesses) {
      console.log(`\n🏢 Business: ${business.name} (${business.id})`);
      
      // Verificar banners en BD
      const banners = await prisma.portalBanner.findMany({
        where: {
          businessId: business.id,
          active: true
        },
        orderBy: { orden: 'asc' }
      });
      
      console.log(`   📑 Banners en BD: ${banners.length}`);
      
      if (banners.length > 0) {
        banners.forEach((banner, index) => {
          console.log(`     ${index + 1}. "${banner.title}" - ${banner.imageUrl ? '✅ Con imagen' : '❌ Sin imagen'} - ${banner.active ? '🟢 Activo' : '🔴 Inactivo'}`);
        });
        
        // Simular request de config-v2
        const configResponse = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${business.id}`);
        
        if (configResponse.ok) {
          const configData = await configResponse.json();
          const clientBanners = configData.banners || [];
          
          console.log(`   📱 Banners en cliente: ${clientBanners.length}`);
          console.log(`   🔄 Sincronización: ${banners.length === clientBanners.length ? '✅ OK' : '❌ DESYNC'}`);
          
          if (banners.length !== clientBanners.length) {
            console.log(`     ⚠️ BD tiene ${banners.length}, Cliente ve ${clientBanners.length}`);
          }
        } else {
          console.log(`   ❌ Error consultando config-v2: ${configResponse.status}`);
        }
      } else {
        console.log(`   📝 Sin banners configurados`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test completado');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testBannersSync();
}

module.exports = { testBannersSync };
