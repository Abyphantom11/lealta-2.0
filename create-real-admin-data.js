// Script para crear datos de ejemplo desde las APIs del admin (no hardcodeados)
// Esto simula lo que harías desde la interfaz del admin

async function createRealAdminData() {
  console.log('🎯 CREANDO DATOS REALES DESDE LAS APIs DEL ADMIN');
  console.log('='.repeat(60));
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds'; // Casa Sabor Demo
  const baseUrl = 'http://localhost:3001';
  
  try {
    // 1. Crear un banner real usando la API del admin
    console.log('📝 1. Creando banner desde API admin...');
    const bannerResponse = await fetch(`${baseUrl}/api/admin/portal/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify({
        title: 'Banner de Lunes - Casa Sabor',
        description: 'Especial de lunes: 20% descuento en todas las bebidas',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        dia: 'lunes',
        orden: 0,
        active: true
      })
    });
    
    if (bannerResponse.ok) {
      const bannerData = await bannerResponse.json();
      console.log('✅ Banner creado:', bannerData.banner?.title);
    } else {
      console.log('❌ Error creando banner:', bannerResponse.status);
    }
    
    // 2. Crear una promoción real usando la API del admin
    console.log('📝 2. Creando promoción desde API admin...');
    const promoResponse = await fetch(`${baseUrl}/api/admin/portal/promociones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify({
        title: 'Promoción Especial Lunes',
        description: 'Descuento especial para clientes leales',
        discount: 15,
        dia: 'lunes',
        active: true,
        orden: 0
      })
    });
    
    if (promoResponse.ok) {
      const promoData = await promoResponse.json();
      console.log('✅ Promoción creada:', promoData.promocion?.title);
    } else {
      console.log('❌ Error creando promoción:', promoResponse.status);
    }
    
    // 3. Crear favorito del día
    console.log('📝 3. Creando favorito del día desde API admin...');
    const favoritoResponse = await fetch(`${baseUrl}/api/admin/portal/favorito-del-dia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify({
        dia: 'lunes',
        imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        horaPublicacion: '04:00',
        active: true
      })
    });
    
    if (favoritoResponse.ok) {
      const favoritoData = await favoritoResponse.json();
      console.log('✅ Favorito del día creado para:', favoritoData.favorito?.dia);
    } else {
      console.log('❌ Error creando favorito:', favoritoResponse.status);
    }
    
    // 4. Verificar que los datos se crearon correctamente
    console.log('\n📊 4. Verificando datos creados...');
    const verifyResponse = await fetch(`${baseUrl}/api/portal/config-v2/?businessId=${businessId}`);
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Verificación exitosa:');
      console.log(`   Banners: ${verifyData.data?.banners?.length || 0}`);
      console.log(`   Promociones: ${verifyData.data?.promociones?.length || 0}`);
      console.log(`   Favorito del día: ${verifyData.data?.favoritoDelDia ? 'Sí' : 'No'}`);
      
      if (verifyData.data?.banners?.length > 0) {
        console.log('\n🎯 BANNERS CREADOS:');
        verifyData.data.banners.forEach((banner, idx) => {
          console.log(`   ${idx + 1}. "${banner.title}" (${banner.active ? 'activo' : 'inactivo'})`);
        });
      }
      
      if (verifyData.data?.promociones?.length > 0) {
        console.log('\n🎯 PROMOCIONES CREADAS:');
        verifyData.data.promociones.forEach((promo, idx) => {
          console.log(`   ${idx + 1}. "${promo.title}" - ${promo.discount}% (${promo.active ? 'activo' : 'inactivo'})`);
        });
      }
    }
    
    console.log('\n🎉 ¡PROCESO COMPLETADO!');
    console.log('📱 Ahora ve al portal del cliente para ver los datos reales');
    console.log(`🔗 ${baseUrl}/casa-sabor-demo/cliente/`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Usar fetch desde Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

createRealAdminData().catch(console.error);
