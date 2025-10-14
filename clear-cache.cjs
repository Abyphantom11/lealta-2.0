// Script para limpiar cache del servidor en desarrollo
const fs = require('fs');
const path = require('path');

console.log('🔄 Limpiando cache de desarrollo...\n');

// 1. Limpiar cache de Next.js
const nextCacheDir = path.join(__dirname, '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('🗑️  Eliminando .next cache...');
  fs.rmSync(nextCacheDir, { recursive: true, force: true });
  console.log('✅ Cache de .next eliminado');
} else {
  console.log('ℹ️  No se encontró cache de .next');
}

// 2. Limpiar cache de node_modules/.cache
const nodeModulesCacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(nodeModulesCacheDir)) {
  console.log('🗑️  Eliminando node_modules/.cache...');
  fs.rmSync(nodeModulesCacheDir, { recursive: true, force: true });
  console.log('✅ Cache de node_modules eliminado');
} else {
  console.log('ℹ️  No se encontró cache de node_modules');
}

// 3. Reiniciar servidor
console.log('\n🚀 Cache limpiado. Reinicia el servidor con: npm run dev');
console.log('🔍 Los logs de debugging mostrarán detalles del cache corrupto.');
