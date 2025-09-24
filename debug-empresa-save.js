// 🔍 Script para diagnosticar el problema de guardado del nombre de empresa

const fs = require('fs');
const path = require('path');

async function debugEmpresaSave() {
    console.log('🔍 DIAGNÓSTICO DEL PROBLEMA DE GUARDADO EMPRESA');
    console.log('=' . repeat(60));
    
    // 1. Verificar archivos JSON existentes
    console.log('\n📁 ARCHIVOS JSON EN config/portal:');
    const configDir = path.join(process.cwd(), 'config', 'portal');
    
    if (fs.existsSync(configDir)) {
        const files = fs.readdirSync(configDir);
        files.forEach(file => {
            if (file.startsWith('portal-config-') && file.endsWith('.json')) {
                const filePath = path.join(configDir, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                console.log(`   📄 ${file}:`);
                console.log(`      nombreEmpresa: "${content.nombreEmpresa}"`);
                console.log(`      tarjetas: ${content.tarjetas?.length || 0} elementos`);
                console.log(`      lastUpdated: ${content.lastUpdated}`);
            }
        });
    }
    
    // 2. Simular guardado para ver qué pasa
    console.log('\n🧪 SIMULANDO GUARDADO:');
    
    // Testear con el business ID correcto
    const businessId = 'cmfw0fujf0000eyv8eyhgfzja'; // Desde la imagen que muestras
    const testData = {
        nombreEmpresa: 'TEST SAVE VERIFICATION',
        tarjetas: [
            {
                nivel: 'oro',
                beneficio: '9 dadadasd',
                puntos: 100
            }
        ],
        nivelesConfig: {}
    };
    
    try {
        // Test guardado local
        const testPath = path.join(configDir, `portal-config-${businessId}.json`);
        console.log(`   💾 Intentando guardar en: ${testPath}`);
        
        let existingConfig = {};
        if (fs.existsSync(testPath)) {
            existingConfig = JSON.parse(fs.readFileSync(testPath, 'utf8'));
            console.log(`   📖 Config actual: nombreEmpresa="${existingConfig.nombreEmpresa}"`);
        }
        
        const updatedConfig = {
            ...existingConfig,
            ...testData,
            lastUpdated: new Date().toISOString(),
            testSave: true
        };
        
        fs.writeFileSync(testPath, JSON.stringify(updatedConfig, null, 2));
        console.log('   ✅ Guardado LOCAL exitoso');
        
        // Verificar que se guardó
        const savedContent = JSON.parse(fs.readFileSync(testPath, 'utf8'));
        console.log(`   ✓ Verificado: nombreEmpresa="${savedContent.nombreEmpresa}"`);
        
    } catch (error) {
        console.log('   ❌ Error en guardado local:', error.message);
    }
    
    // 3. Testear el endpoint API
    console.log('\n🌐 TESTEANDO ENDPOINT API:');
    
    const testUrl = 'http://localhost:3000/api/admin/portal-config';
    console.log(`   🎯 URL: ${testUrl}`);
    
    try {
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(testUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer fake-token' // Esto fallará pero veremos la respuesta
            },
            body: JSON.stringify({
                businessId: businessId,
                nombreEmpresa: 'TEST API CALL',
                tarjetas: testData.tarjetas
            })
        });
        
        console.log(`   📡 Status: ${response.status}`);
        const responseText = await response.text();
        console.log(`   📄 Response: ${responseText.substring(0, 200)}...`);
        
    } catch (error) {
        console.log('   ❌ Error en API call:', error.message);
    }
    
    // 4. Verificar URLs del cliente
    console.log('\n🖥️ VERIFICANDO URLS DEL CLIENTE:');
    const clientUrl = `http://localhost:3000/api/portal/config-v2?businessId=${businessId}`;
    console.log(`   🎯 URL Cliente: ${clientUrl}`);
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(clientUrl);
        
        if (response.ok) {
            const data = await response.json();
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📊 nombreEmpresa: "${data.nombreEmpresa}"`);
            console.log(`   📊 tarjetas: ${data.tarjetas?.length || 0} elementos`);
            console.log(`   📊 Primera tarjeta: ${data.tarjetas?.[0]?.beneficio || 'N/A'}`);
        } else {
            console.log(`   ❌ Status: ${response.status}`);
        }
        
    } catch (error) {
        console.log('   ❌ Error en cliente URL:', error.message);
    }
    
    console.log('\n' + '=' . repeat(60));
    console.log('🎯 PRÓXIMOS PASOS:');
    console.log('1. Verificar que el business ID en la URL admin coincida con el archivo JSON');
    console.log('2. Revisar los logs del servidor durante el guardado');
    console.log('3. Confirmar que la autenticación esté funcionando');
}

// Ejecutar diagnóstico
debugEmpresaSave().catch(console.error);
