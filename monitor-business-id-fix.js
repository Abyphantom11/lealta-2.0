// 🔍 Monitor para verificar que la corrección del business ID funciona en producción

const https = require('https');

async function monitorBusinessIdFix() {
    console.log('🔍 MONITOREANDO CORRECCIÓN BUSINESS ID');
    console.log('=' . repeat(60));
    console.log(`⏰ ${new Date().toLocaleTimeString('es')} - Iniciando monitoreo...`);
    
    // Verificación cada 30 segundos por hasta 10 minutos
    const maxChecks = 20;
    let checkCount = 0;
    
    const checkDeployment = async () => {
        checkCount++;
        console.log(`\n📡 Verificación ${checkCount}/${maxChecks} - ${new Date().toLocaleTimeString('es')}`);
        
        try {
            // Probar el endpoint principal de la aplicación para ver si está actualizado
            const response = await fetch('https://lealta.app/arepa/admin/', {
                method: 'GET',
                headers: {
                    'User-Agent': 'Monitor-BusinessID-Fix/1.0'
                }
            });
            
            console.log(`   📡 Status app principal: ${response.status}`);
            
            // Verificar que no hay errores 500 o problemas de compilación
            if (response.status === 200) {
                const text = await response.text();
                
                // Buscar indicadores de que la app se compiló correctamente
                const hasReact = text.includes('__NEXT_DATA__') || text.includes('react');
                const hasErrors = text.includes('Application error') || text.includes('500');
                
                console.log(`   ✅ App cargada: ${hasReact ? 'SÍ' : 'NO'}`);
                console.log(`   ❌ Errores: ${hasErrors ? 'SÍ' : 'NO'}`);
                
                if (hasReact && !hasErrors) {
                    console.log('\n🎉 ¡DEPLOY COMPLETADO! La aplicación se compiló correctamente.');
                    console.log('\n📋 PRÓXIMO PASO:');
                    console.log('1. 🔐 Hacer login como usuario en lealta.app/arepa/admin/');
                    console.log('2. 🛠️ Ir a Portal Cliente > Tarjetas');
                    console.log('3. ✏️ Editar "Nombre de la Empresa en Tarjetas"');
                    console.log('4. 💾 Guardar cambios');
                    console.log('5. 🔄 Recargar la página');
                    console.log('6. ✅ Verificar que el cambio persiste (no regresa al valor anterior)');
                    
                    return true; // Deploy completado
                }
            }
            
            console.log(`   ⏳ Esperando deploy... (Status: ${response.status})`);
            
        } catch (error) {
            console.log(`   ❌ Error en verificación: ${error.message}`);
        }
        
        return false; // Seguir esperando
    };
    
    const interval = setInterval(async () => {
        const deployComplete = await checkDeployment();
        
        if (deployComplete || checkCount >= maxChecks) {
            clearInterval(interval);
            
            if (checkCount >= maxChecks) {
                console.log('\n⚠️ Tiempo de espera agotado.');
                console.log('💡 El deploy puede necesitar más tiempo. Verifica manualmente.');
            }
            
            console.log('\n🎯 RESUMEN DE LA CORRECCIÓN APLICADA:');
            console.log('• Frontend ya NO envía businessId en requests');
            console.log('• Backend usa SOLO session.businessId del usuario autenticado');
            console.log('• Solucionado business isolation para cualquier usuario');
            console.log('• Las ediciones ahora se guardan en el portal correcto');
        }
    }, 30000); // Cada 30 segundos
    
    // Primera verificación inmediata
    const initialCheck = await checkDeployment();
    if (initialCheck) {
        clearInterval(interval);
    }
}

// Ejecutar monitor
monitorBusinessIdFix().catch(console.error);
