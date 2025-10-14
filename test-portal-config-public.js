const fs = require('fs');
const path = require('path');

// Script para probar la API pública de portal config
async function testPortalConfigPublic() {
  console.log('🔬 Probando API pública de portal config...\n');
  
  const baseUrl = 'http://localhost:3000';
  const businessId = 'cmfnkcc1f0000eyj0dq0lcjji';
  
  try {
    // 1. Probar API pública (sin auth)
    console.log('📡 Probando /api/portal/config (público)...');
    const publicResponse = await fetch(`${baseUrl}/api/portal/config?businessId=${businessId}`);
    console.log(`Status: ${publicResponse.status}`);
    
    if (publicResponse.ok) {
      const data = await publicResponse.json();
      console.log('✅ API pública funciona correctamente');
      console.log(`- Empresa: ${data.data?.nombreEmpresa || 'No definida'}`);
      console.log(`- Banners: ${data.data?.banners?.length || 0}`);
      console.log(`- Promociones: ${data.data?.promociones?.length || 0}`);
      console.log(`- Tarjetas: ${data.data?.tarjetas?.length || 0}`);
    } else {
      console.log('❌ Error en API pública:', await publicResponse.text());
    }
    
    console.log('\n');
    
    // 2. Verificar que el archivo de config existe
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    console.log('📁 Verificando archivo de configuración...');
    console.log(`Ruta: ${configPath}`);
    
    if (fs.existsSync(configPath)) {
      console.log('✅ Archivo de configuración encontrado');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log(`- Última actualización: ${config.lastUpdated || 'No registrada'}`);
      console.log(`- Versión del archivo: ${config.version || 'No especificada'}`);
    } else {
      console.log('⚠️ Archivo de configuración no encontrado');
      console.log('Esto puede ser normal si es la primera vez que se accede');
    }
    
    console.log('\n');
    
    // 3. Probar con simulación de día
    console.log('🎭 Probando simulación de día...');
    const simulatedResponse = await fetch(`${baseUrl}/api/portal/config?businessId=${businessId}&simulateDay=lunes`);
    console.log(`Status: ${simulatedResponse.status}`);
    
    if (simulatedResponse.ok) {
      const data = await simulatedResponse.json();
      console.log('✅ Simulación de día funciona');
    } else {
      console.log('❌ Error en simulación:', await simulatedResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 El servidor no está corriendo. Para probar:');
      console.log('   npm run dev');
      console.log('   Y luego ejecuta este script nuevamente');
    }
  }
}

// Función para verificar archivos críticos
function checkCriticalFiles() {
  console.log('\n🔍 Verificando archivos críticos...\n');
  
  const criticalFiles = [
    'src/app/api/portal/config/route.ts',
    'src/app/api/admin/portal-config/route.ts',
    'src/app/cliente/components/AuthHandler.tsx',
    'src/hooks/useAutoRefreshPortalConfig.ts'
  ];
  
  criticalFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - NO ENCONTRADO`);
    }
  });
}

// Ejecutar pruebas
checkCriticalFiles();

// Si hay argumentos, solo verificar archivos
if (process.argv.includes('--files-only')) {
  process.exit(0);
}

// Ejecutar pruebas de API
testPortalConfigPublic();
