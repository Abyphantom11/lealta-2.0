const axios = require('axios');

async function testAdminUpdate() {
    console.log('🔧 Probando actualización desde admin...\n');
    
    try {
        // 1. Verificar estado actual
        console.log('📊 PASO 1: Estado actual en cliente (API v2)');
        const clienteResponse = await axios.get('http://localhost:3001/api/portal/config-v2', {
            params: { businessId: 'cmfqhepmq0000ey4slyms4knv' }
        });
        
        const recompensasAntes = clienteResponse.data.recompensas || [];
        console.log(`🎁 Recompensas activas antes: ${recompensasAntes.length}`);
        recompensasAntes.forEach(r => {
            console.log(`  - ${r.titulo}: ${r.puntos} pts (activo: ${r.activo})`);
        });
        
        console.log('\n🔄 PASO 2: Simulando actualización desde admin...');
        
        // 2. Hacer una actualización típica del admin
        const updateData = {
            businessId: 'cmfqhepmq0000ey4slyms4knv',
            banners: [
                {
                    titulo: 'Banner Test',
                    imagen: 'https://example.com/banner.jpg',
                    activo: true
                }
            ],
            promociones: [
                {
                    titulo: 'Promo Test',
                    descripcion: 'Descripción de prueba',
                    activo: true
                }
            ],
            recompensas: [
                {
                    titulo: 'werwr',
                    descripcion: 'werwr description',
                    puntos: 203,
                    activo: true
                },
                {
                    titulo: 'dsfsf',
                    descripcion: 'dsfsf description',
                    puntos: 200,
                    activo: false  // ⚠️ CAMBIAMOS ESTO A FALSE PARA PROBAR
                },
                {
                    titulo: 'Nueva Recompensa Test',
                    descripcion: 'Recompensa añadida desde admin',
                    puntos: 150,
                    activo: true
                }
            ],
            favoritosDia: [
                {
                    titulo: 'Favorito Test',
                    descripcion: 'Descripción favorito',
                    activo: true
                }
            ]
        };
        
        // Simulamos el PUT del admin
        console.log('📤 Enviando actualización via admin API...');
        const adminResponse = await axios.put(
            'http://localhost:3001/api/admin/portal-config',
            updateData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log(`✅ Admin response: ${adminResponse.status} - ${adminResponse.statusText}`);
        
        // 3. Verificar que el cliente ve los cambios inmediatamente
        console.log('\n📊 PASO 3: Verificando cambios en cliente (API v2)');
        const clienteResponseDespues = await axios.get('http://localhost:3001/api/portal/config-v2', {
            params: { businessId: 'cmfqhepmq0000ey4slyms4knv' }
        });
        
        const recompensasDespues = clienteResponseDespues.data.recompensas || [];
        console.log(`🎁 Recompensas activas después: ${recompensasDespues.length}`);
        recompensasDespues.forEach(r => {
            console.log(`  - ${r.titulo}: ${r.puntos} pts (activo: ${r.activo})`);
        });
        
        // 4. Análisis de cambios
        console.log('\n🔍 ANÁLISIS DE CAMBIOS:');
        console.log(`• dsfsf debería estar INACTIVA (activo: false)`);
        console.log(`• Nueva Recompensa Test debería aparecer`);
        console.log(`• werwr debería seguir activa`);
        
        const dsfsf = recompensasDespues.find(r => r.titulo === 'dsfsf');
        const nueva = recompensasDespues.find(r => r.titulo === 'Nueva Recompensa Test');
        const werwr = recompensasDespues.find(r => r.titulo === 'werwr');
        
        console.log('\n📋 RESULTADOS:');
        if (dsfsf && !dsfsf.activo) {
            console.log('✅ dsfsf correctamente desactivada');
        } else {
            console.log('❌ dsfsf no se desactivó correctamente');
        }
        
        if (nueva && nueva.activo) {
            console.log('✅ Nueva recompensa añadida correctamente');
        } else {
            console.log('❌ Nueva recompensa no aparece');
        }
        
        if (werwr && werwr.activo) {
            console.log('✅ werwr sigue activa como esperado');
        } else {
            console.log('❌ werwr cambió inesperadamente');
        }
        
        console.log('\n🎉 CONCLUSIÓN:');
        if (dsfsf && !dsfsf.activo && nueva && nueva.activo && werwr && werwr.activo) {
            console.log('✅ ÉXITO TOTAL: El admin puede modificar y el cliente ve los cambios inmediatamente!');
            console.log('✅ La sincronización bidireccional funciona perfectamente como el sistema de branding.');
        } else {
            console.log('⚠️  Hay algunos problemas en la sincronización que necesitan revisión.');
        }
        
    } catch (error) {
        console.error('❌ Error durante la prueba:', error.response?.data || error.message);
    }
}

testAdminUpdate();
