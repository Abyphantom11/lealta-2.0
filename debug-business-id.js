// 🔍 Script para verificar el Business ID correcto y solucionar el problema

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO BUSINESS ID DEL ADMIN PANEL');
console.log('=' . repeat(60));

// Todos los business IDs encontrados
const businessIds = [
    'cmfvlkngf0000eybk87ifx71m',
    'cmfw0fujf0000eyv8eyhgfzja',
    'cmfw6hnpm0000eyaowl0e70bj',
    'cmfwy1fey0000jr0aetifvrb3',
    'arepa' // El que aparece en la URL
];

console.log('\n📋 TODOS LOS ARCHIVOS DE CONFIGURACIÓN:');
businessIds.forEach(businessId => {
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`\n📄 Business ID: ${businessId}`);
        console.log(`   nombreEmpresa: "${config.nombreEmpresa}"`);
        console.log(`   tarjetas: ${config.tarjetas?.length || 0} elementos`);
        console.log(`   beneficio oro: "${config.tarjetas?.find(t => t.nivel === 'oro')?.beneficio || 'N/A'}"`);
        console.log(`   lastUpdated: ${config.lastUpdated}`);
    } else {
        console.log(`\n❌ Business ID: ${businessId} - NO EXISTE`);
    }
});

// Buscar el que tiene "9 dadadasd"
console.log('\n🎯 BUSCANDO EL CORRECTO (con "9 dadadasd"):');
businessIds.forEach(businessId => {
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const tarjetaOro = config.tarjetas?.find(t => t.nivel === 'oro');
        
        if (tarjetaOro?.beneficio === '9 dadadasd') {
            console.log(`\n✅ ENCONTRADO! Business ID correcto: ${businessId}`);
            console.log(`   nombreEmpresa actual: "${config.nombreEmpresa}"`);
            console.log(`   ¿Es "love me sky"? ${config.nombreEmpresa === 'love me sky' ? '✅ SÍ' : '❌ NO'}`);
            
            // Crear archivo de mapeo para el frontend
            const mappingPath = path.join(process.cwd(), 'business-id-mapping.json');
            const mapping = {
                correctBusinessId: businessId,
                currentName: config.nombreEmpresa,
                foundAt: new Date().toISOString()
            };
            
            fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
            console.log(`   📝 Mapping guardado en: business-id-mapping.json`);
        }
    }
});

console.log('\n💡 PROBLEMA IDENTIFICADO:');
console.log('Si estás en lealta.app/arepa/admin/ pero el archivo correcto es otro Business ID,');
console.log('entonces el admin panel está leyendo/escribiendo en el archivo incorrecto.');

console.log('\n🔧 SOLUCIONES:');
console.log('1. Cambiar la URL a usar el Business ID correcto');
console.log('2. O copiar la configuración al archivo "arepa"');
console.log('3. O modificar el código para que detecte automáticamente el ID correcto');
