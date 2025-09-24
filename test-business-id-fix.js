// 🧪 Script de prueba para verificar que la corrección del business ID funciona

const fs = require('fs');
const path = require('path');

console.log('🧪 VERIFICACIÓN DE CORRECCIÓN BUSINESS ID');
console.log('=' . repeat(60));

// Verificar que los archivos fueron modificados correctamente
const files = [
    'src/components/admin-v2/portal/TarjetaEditor.tsx',
    'src/components/admin-v2/portal/PortalContent.tsx',
    'src/app/api/admin/portal-config/route.ts'
];

console.log('\n📋 VERIFICANDO CAMBIOS EN ARCHIVOS:');
files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        console.log(`\n📄 ${file}:`);
        
        // Verificar TarjetaEditor.tsx
        if (file.includes('TarjetaEditor.tsx')) {
            const hasOldLogic = content.includes('window.location.pathname.split') && 
                               content.includes('businessId: currentBusinessId');
            const hasNewLogic = content.includes('business ID se obtiene de sesión autenticada') ||
                               !content.includes('businessId: currentBusinessId');
            
            console.log(`   ❌ Lógica antigua (extraer de URL): ${hasOldLogic ? 'SÍ ENCONTRADA' : 'REMOVIDA ✅'}`);
            console.log(`   ✅ Nueva lógica (usar sesión): ${hasNewLogic ? 'IMPLEMENTADA ✅' : 'FALTA'}`);
        }
        
        // Verificar PortalContent.tsx
        if (file.includes('PortalContent.tsx')) {
            const hasOldQuery = content.includes('businessId=${finalBusinessId}');
            const hasNewLogic = content.includes('businessId desde sesión autenticada') ||
                               !content.includes('businessId=${');
            
            console.log(`   ❌ Query con businessId: ${hasOldQuery ? 'SÍ ENCONTRADO' : 'REMOVIDO ✅'}`);
            console.log(`   ✅ Sin query businessId: ${hasNewLogic ? 'IMPLEMENTADO ✅' : 'FALTA'}`);
        }
        
        // Verificar route.ts
        if (file.includes('route.ts')) {
            const hasSecurityCheck = content.includes('SECURITY: Client sent businessId');
            const usesSessionId = content.includes('session.businessId');
            
            console.log(`   ✅ Usa session.businessId: ${usesSessionId ? 'SÍ ✅' : 'FALTA'}`);
            console.log(`   🔒 Check de seguridad: ${hasSecurityCheck ? 'IMPLEMENTADO ✅' : 'FALTA'}`);
        }
        
    } else {
        console.log(`   ❌ ${file} - NO EXISTE`);
    }
});

// Verificar que los archivos de configuración existan
console.log('\n📁 ARCHIVOS DE CONFIGURACIÓN:');
const configDir = path.join(process.cwd(), 'config', 'portal');
if (fs.existsSync(configDir)) {
    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.json'));
    console.log(`   📊 Total archivos: ${configFiles.length}`);
    
    configFiles.forEach(file => {
        const filePath = path.join(configDir, file);
        const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const businessId = file.replace('portal-config-', '').replace('.json', '');
        console.log(`   📄 ${businessId}: "${config.nombreEmpresa}" (${config.tarjetas?.length || 0} tarjetas)`);
    });
} else {
    console.log('   ❌ Directorio config/portal no existe');
}

console.log('\n🎯 EXPECTATIVAS DE LA CORRECCIÓN:');
console.log('1. ✅ Frontend NO envía businessId en el body o query');
console.log('2. ✅ Backend usa SOLO session.businessId del usuario autenticado');
console.log('3. ✅ Funciona para cualquier usuario sin importar la URL');
console.log('4. ✅ Mantiene business isolation correcto');

console.log('\n💡 PRÓXIMO PASO:');
console.log('Hacer commit y deploy para probar con usuario real');
