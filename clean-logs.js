const fs = require('fs');
const path = require('path');

// Archivos a limpiar (los que más spam generan)
const filesToClean = [
  'src/hooks/useAutoRefreshPortalConfig.ts',
  'src/app/cliente/components/sections/FavoritoDelDiaSection.tsx',
  'src/app/cliente/components/sections/DebugBannersSection.tsx',
  'src/app/cliente/components/AuthHandler.tsx'
];

function cleanLogs(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Archivo no encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya tiene debugLog import
    const hasDebugImport = content.includes("import { debugLog") || content.includes("from '@/lib/debug-utils'");
    
    if (!hasDebugImport) {
      // Agregar import después del último import
      const lastImportIndex = content.lastIndexOf("import ");
      if (lastImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', lastImportIndex);
        if (nextLineIndex !== -1) {
          content = content.slice(0, nextLineIndex + 1) + 
                   "import { debugLog } from '@/lib/debug-utils';\n" + 
                   content.slice(nextLineIndex + 1);
        }
      }
    }
    
    // Reemplazar console.log con debugLog
    content = content.replace(/console\.log\(/g, 'debugLog(');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Limpiado: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error limpiando ${filePath}:`, error.message);
  }
}

console.log('🧹 Limpiando logs de producción...\n');

filesToClean.forEach(file => {
  cleanLogs(file);
});

console.log('\n✅ ¡Limpieza completada!');
