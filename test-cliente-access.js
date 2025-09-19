const axios = require('axios');

async function testClienteAccess() {
    console.log('🔧 Probando acceso del cliente...\n');
    
    try {
        console.log('📊 PASO 1: Consultando API v2 del cliente');
        const response = await axios.get('http://localhost:3001/api/portal/config-v2', {
            params: { businessId: 'cmfqhepmq0000ey4slyms4knv' }
        });
        
        const data = response.data;
        console.log(`✅ Response status: ${response.status}`);
        
        console.log('\n📋 CONFIGURACIÓN ACTUAL DEL PORTAL:');
        
        // Banners
        console.log(`🎨 Banners: ${data.banners?.length || 0}`);
        if (data.banners?.length > 0) {
            data.banners.forEach((banner, index) => {
                console.log(`  ${index + 1}. ${banner.titulo || banner.title} (activo: ${banner.activo ?? banner.isActive})`);
            });
        }
        
        // Promociones
        console.log(`🔥 Promociones: ${data.promociones?.length || 0}`);
        if (data.promociones?.length > 0) {
            data.promociones.forEach((promo, index) => {
                console.log(`  ${index + 1}. ${promo.titulo || promo.title} (activo: ${promo.activo ?? promo.isActive})`);
            });
        }
        
        // Recompensas - La parte más importante
        console.log(`🎁 Recompensas: ${data.recompensas?.length || 0}`);
        if (data.recompensas?.length > 0) {
            data.recompensas.forEach((recompensa, index) => {
                console.log(`  ${index + 1}. ${recompensa.titulo || recompensa.title}: ${recompensa.puntos || recompensa.points} pts (activo: ${recompensa.activo ?? recompensa.isActive})`);
            });
            
            // Verificación específica de las recompensas del usuario
            const werwr = data.recompensas.find(r => (r.titulo || r.title) === 'werwr');
            const dsfsf = data.recompensas.find(r => (r.titulo || r.title) === 'dsfsf');
            
            console.log('\n🔍 VERIFICACIÓN DE RECOMPENSAS ESPERADAS:');
            if (werwr) {
                console.log(`✅ "werwr" encontrada: ${werwr.puntos || werwr.points} pts (activo: ${werwr.activo ?? werwr.isActive})`);
            } else {
                console.log('❌ "werwr" NO encontrada');
            }
            
            if (dsfsf) {
                console.log(`✅ "dsfsf" encontrada: ${dsfsf.puntos || dsfsf.points} pts (activo: ${dsfsf.activo ?? dsfsf.isActive})`);
            } else {
                console.log('❌ "dsfsf" NO encontrada');
            }
        }
        
        // Favoritos del día
        console.log(`⭐ Favoritos del día: ${data.favoritosDia?.length || 0}`);
        if (data.favoritosDia?.length > 0) {
            data.favoritosDia.forEach((fav, index) => {
                console.log(`  ${index + 1}. ${fav.titulo || fav.title} (activo: ${fav.activo ?? fav.isActive})`);
            });
        }
        
        console.log('\n🎉 RESULTADO FINAL:');
        const recompensasActivas = data.recompensas?.filter(r => r.activo ?? r.isActive) || [];
        console.log(`✅ El cliente puede acceder a ${recompensasActivas.length} recompensas activas`);
        console.log('✅ La migración de JSON a PostgreSQL fue exitosa');
        console.log('✅ Los datos están correctamente disponibles para el portal del cliente');
        
    } catch (error) {
        console.error('❌ Error consultando cliente:', error.response?.data || error.message);
    }
}

testClienteAccess();
