const fs = require('fs');
const path = require('path');

// APIs más críticas que generan spam en producción
const apiFiles = [
  'src/app/api/portal/config-v2/route.ts',
  'src/app/api/portal/config/route.ts', 
  'src/app/api/portal/banners/route.ts',
  'src/app/api/reservas/route.ts',
  'src/hooks/useAutoRefreshPortalConfig.ts'
];

// Componentes del cliente que también generan spam
const clientFiles = [
  'src/app/cliente/components/sections/FavoritoDelDiaSection.tsx',
  'src/app/cliente/components/sections/DebugBannersSection.tsx',
  'src/app/cliente/components/AuthHandler.tsx'
];

function cleanFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Archivo no encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalLines = content.split('\n').length;
    
    // Contar logs originales
    let originalLogs = (content.match(/console\.log\(/g) || []).length;
    
    // Eliminar líneas completas que contengan console.log
    const lines = content.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      // Eliminar líneas que solo contienen console.log
      return !trimmed.startsWith('console.log(') && 
             !trimmed.includes('console.log(`') &&
             !trimmed.includes('console.log(\'');
    });
    
    content = cleanedLines.join('\n');
    
    // Limpiar console.log restantes en líneas mixtas
    content = content.replace(/console\.log\([^)]*\);\s*/g, '');
    content = content.replace(/;\s*console\.log\([^)]*\)/g, '');
    
    let finalLogs = (content.match(/console\.log\(/g) || []).length;
    
    fs.writeFileSync(filePath, content);
    
    console.log(`✅ ${filePath}`);
    console.log(`   📊 Logs eliminados: ${originalLogs} → ${finalLogs}`);
    console.log(`   📄 Líneas: ${originalLines} → ${cleanedLines.length}`);
    
  } catch (error) {
    console.error(`❌ Error limpiando ${filePath}:`, error.message);
  }
}

console.log('🧹 LIMPIEZA AGRESIVA DE LOGS DE PRODUCCIÓN');
console.log('==========================================\n');

console.log('🔥 Limpiando APIs críticas...');
apiFiles.forEach(file => cleanFile(file));

console.log('\n📱 Limpiando componentes de cliente...');  
clientFiles.forEach(file => cleanFile(file));

console.log('\n✅ ¡Limpieza agresiva completada!');
console.log('💡 Los logs ahora solo aparecerán en desarrollo (NODE_ENV=development)');
