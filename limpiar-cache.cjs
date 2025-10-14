// Script para limpiar cache corrupto del middleware
console.log('🧹 LIMPIANDO CACHE DEL MIDDLEWARE');

// Reiniciar el servidor de desarrollo limpiará automáticamente el cache en memoria
console.log('✅ Para limpiar el cache completamente:');
console.log('1. Detener el servidor (Ctrl+C)');
console.log('2. Ejecutar: npm run dev');
console.log('3. El cache se reiniciará automáticamente');

// También podemos limpiar archivos de cache de Next.js
const fs = require('fs');
const path = require('path');

const nextCacheDir = path.join(__dirname, '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('🗑️ Eliminando cache de Next.js...');
  try {
    fs.rmSync(nextCacheDir, { recursive: true, force: true });
    console.log('✅ Cache de Next.js eliminado');
  } catch (error) {
    console.log('⚠️ No se pudo eliminar cache:', error.message);
  }
} else {
  console.log('📂 No hay cache de Next.js para eliminar');
}

console.log('\n🔄 Reinicia el servidor para aplicar cambios');
console.log('npm run dev');
