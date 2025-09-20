// Script para limpiar todos los console.log del sistema
const fs = require('fs');
const path = require('path');

// Directorios a procesar
const dirsToClean = [
  'src/app/cliente',
  'src/app/admin',
  'src/components',
  'src/lib',
  'src/hooks'
];

function cleanLogsFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Patrones a eliminar
    const logPatterns = [
      /^\s*console\.log\(.*?\);?\s*$/gm,
      /^\s*console\.warn\(.*?\);?\s*$/gm,
      /^\s*console\.error\(.*?\);?\s*$/gm,
      /^\s*console\.debug\(.*?\);?\s*$/gm,
      /^\s*console\.info\(.*?\);?\s*$/gm,
      /^\s*\/\/ console\..*$/gm,
      /^\s*\/\*.*console\..*\*\/\s*$/gm
    ];
    
    let originalLength = content.length;
    
    logPatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Limpiar líneas vacías múltiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content.length !== originalLength) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Limpiado: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn(`⚠️ Error procesando ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    let cleanedCount = 0;
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        cleanedCount += processDirectory(fullPath);
      } else if (file.name.match(/\.(tsx?|jsx?)$/)) {
        if (cleanLogsFromFile(fullPath)) {
          cleanedCount++;
        }
      }
    });
    
    return cleanedCount;
  } catch (error) {
    console.warn(`⚠️ Error accediendo a directorio ${dirPath}:`, error.message);
    return 0;
  }
}

console.log('🧹 Iniciando limpieza de console.log...');

let totalCleaned = 0;
dirsToClean.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`\n📁 Procesando: ${dir}`);
    const cleaned = processDirectory(dir);
    totalCleaned += cleaned;
    console.log(`   ${cleaned} archivos limpiados`);
  } else {
    console.log(`⚠️ Directorio no encontrado: ${dir}`);
  }
});

console.log(`\n✨ Limpieza completada: ${totalCleaned} archivos modificados`);
console.log('🚀 La consola debería estar mucho más limpia ahora');
