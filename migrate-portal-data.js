// Script para migrar los datos del portal del businessId incorrecto al correcto
const { PrismaClient } = require('@prisma/client');

async function migratePortalData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 MIGRANDO DATOS DEL PORTAL AL BUSINESS CORRECTO');
    console.log('='.repeat(60));
    
    const sourceBusinessId = 'cmgh621rd0012lb0aixrzpvrw'; // Love Me Sky (donde están los datos)
    const targetBusinessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo (donde deben estar)
    
    console.log(`📤 Origen: ${sourceBusinessId} (Love Me Sky)`);
    console.log(`📥 Destino: ${targetBusinessId} (Casa Sabor Demo)`);
    
    // 1. Obtener todos los banners del businessId incorrecto
    console.log('\n📊 1. Obteniendo banners a migrar...');
    
    const bannersToMigrate = await prisma.portalBanner.findMany({
      where: { businessId: sourceBusinessId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Banners encontrados: ${bannersToMigrate.length}`);
    
    if (bannersToMigrate.length > 0) {
      console.log('   📋 Banners a migrar:');
      bannersToMigrate.forEach((banner, idx) => {
        console.log(`      ${idx + 1}. "${banner.title}" (${banner.active ? 'activo' : 'inactivo'}) - Día: ${banner.dia || 'sin día'}`);
      });
    }
    
    // 2. Obtener promociones del businessId incorrecto
    console.log('\n📊 2. Obteniendo promociones a migrar...');
    
    const promocionesToMigrate = await prisma.portalPromocion.findMany({
      where: { businessId: sourceBusinessId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Promociones encontradas: ${promocionesToMigrate.length}`);
    
    if (promocionesToMigrate.length > 0) {
      console.log('   📋 Promociones a migrar:');
      promocionesToMigrate.forEach((promo, idx) => {
        console.log(`      ${idx + 1}. "${promo.title}" (${promo.active ? 'activo' : 'inactivo'}) - Día: ${promo.dia || 'sin día'}`);
      });
    }
    
    // 3. Migrar banners
    if (bannersToMigrate.length > 0) {
      console.log('\n🔄 3. Migrando banners...');
      
      for (const banner of bannersToMigrate) {
        // Crear nuevo banner en el businessId correcto
        const newBanner = await prisma.portalBanner.create({
          data: {
            businessId: targetBusinessId,
            title: banner.title,
            description: banner.description,
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl,
            dia: banner.dia,
            horaPublicacion: banner.horaPublicacion,
            active: banner.active,
            orden: banner.orden
          }
        });
        
        console.log(`   ✅ Migrado: "${banner.title}" -> ${newBanner.id}`);
        
        // Eliminar banner del businessId incorrecto
        await prisma.portalBanner.delete({
          where: { id: banner.id }
        });
        
        console.log(`   🗑️ Eliminado del origen: ${banner.id}`);
      }
    }
    
    // 4. Migrar promociones
    if (promocionesToMigrate.length > 0) {
      console.log('\n🔄 4. Migrando promociones...');
      
      for (const promo of promocionesToMigrate) {
        // Crear nueva promoción en el businessId correcto
        const newPromo = await prisma.portalPromocion.create({
          data: {
            businessId: targetBusinessId,
            title: promo.title,
            description: promo.description,
            discount: promo.discount,
            imageUrl: promo.imageUrl,
            dia: promo.dia,
            horaInicio: promo.horaInicio,
            horaTermino: promo.horaTermino,
            active: promo.active,
            orden: promo.orden
          }
        });
        
        console.log(`   ✅ Migrado: "${promo.title}" -> ${newPromo.id}`);
        
        // Eliminar promoción del businessId incorrecto
        await prisma.portalPromocion.delete({
          where: { id: promo.id }
        });
        
        console.log(`   🗑️ Eliminado del origen: ${promo.id}`);
      }
    }
    
    // 5. Verificar migración
    console.log('\n📊 5. Verificando migración...');
    
    const newBanners = await prisma.portalBanner.count({
      where: { businessId: targetBusinessId }
    });
    
    const newPromociones = await prisma.portalPromocion.count({
      where: { businessId: targetBusinessId }
    });
    
    const remainingBanners = await prisma.portalBanner.count({
      where: { businessId: sourceBusinessId }
    });
    
    const remainingPromociones = await prisma.portalPromocion.count({
      where: { businessId: sourceBusinessId }
    });
    
    console.log(`   ✅ Casa Sabor Demo ahora tiene: ${newBanners} banners, ${newPromociones} promociones`);
    console.log(`   🧹 Love Me Sky ahora tiene: ${remainingBanners} banners, ${remainingPromociones} promociones`);
    
    if (newBanners > 0 || newPromociones > 0) {
      console.log('\n🎉 ¡MIGRACIÓN EXITOSA!');
      console.log('📱 Ahora ve al portal del cliente para ver tus datos:');
      console.log('🔗 http://localhost:3001/casa-sabor-demo/cliente/');
      console.log('\n💡 Los datos ahora deberían aparecer correctamente en la API');
    } else {
      console.log('\n⚠️ No se migraron datos. Verificar configuraciones.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePortalData().catch(console.error);
