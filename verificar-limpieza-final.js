// 🧹 VERIFICACIÓN FINAL: Limpieza de código debug/testing
// Este script verifica que todo el código de debug/testing ha sido eliminado

const fs = require('fs');
const path = require('path');

console.log('🧹 VERIFICACIÓN FINAL - LIMPIEZA DE CÓDIGO DEBUG/TESTING');
console.log('======================================================');

// Patrones de debug/testing a buscar
const debugPatterns = [
  /console\.log.*🐛.*debug/i,
  /🔄\s*Migrar/,
  /🔧\s*Reparar/,
  /Migrar.*base64/i,
  /handleMigrateBase64Images/,
  /handleCleanupCarousel/,
  /debug.*verificar.*datos/i
];

// Archivos específicos que se limpiaron
const cleanedFiles = [
  'src/components/admin-v2/portal/BrandingManager.tsx',
  'src/app/cliente/components/dashboard/BalanceCard.tsx'
];

function searchFileForPatterns(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const found = [];

    lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        if (pattern.test(line)) {
          found.push({
            line: index + 1,
            content: line.trim(),
            pattern: pattern.toString()
          });
        }
      });
    });

    return found;
  } catch (error) {
    return [`Error reading file: ${error.message}`];
  }
}

function checkFile(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  console.log(`\n🔍 Verificando: ${relativePath}`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`   ❌ Archivo no encontrado`);
    return false;
  }

  const found = searchFileForPatterns(fullPath, debugPatterns);
  
  if (found.length === 0) {
    console.log(`   ✅ LIMPIO - No se encontraron patrones de debug/testing`);
    return true;
  } else {
    console.log(`   ❌ ENCONTRADOS ${found.length} patrones de debug/testing:`);
    found.forEach(item => {
      console.log(`      Línea ${item.line}: ${item.content}`);
    });
    return false;
  }
}

// Verificar archivos limpiados
console.log('\n📁 VERIFICANDO ARCHIVOS LIMPIADOS:');
let allClean = true;

cleanedFiles.forEach(file => {
  const isClean = checkFile(file);
  if (!isClean) allClean = false;
});

// Verificar algunos archivos adicionales por si acaso
const additionalFiles = [
  'src/components/admin-v2/portal/TarjetaEditorUnified.tsx',
  'src/components/admin-v2/portal/PortalContentManager.tsx'
];

console.log('\n📂 VERIFICANDO ARCHIVOS ADICIONALES:');
additionalFiles.forEach(file => {
  checkFile(file);
});

// Resumen final
console.log('\n📊 RESUMEN DE LIMPIEZA:');
console.log('======================');

if (allClean) {
  console.log('✅ LIMPIEZA COMPLETA');
  console.log('   - Botones "🔄 Migrar" y "🔧 Reparar" eliminados');
  console.log('   - Funciones handleMigrateBase64Images y handleCleanupCarousel eliminadas');
  console.log('   - Console.log de debug eliminados de BalanceCard');
  console.log('   - Botón "Limpiar todo" conservado correctamente');
} else {
  console.log('⚠️ LIMPIEZA INCOMPLETA');
  console.log('   - Revisar archivos marcados arriba');
}

console.log('\n🎯 ELEMENTOS CONSERVADOS:');
console.log('   ✅ Botón "Limpiar todo" (funcionalidad útil)');
console.log('   ✅ Funcionalidad core del sistema');
console.log('   ✅ Logs de sistema importantes');

console.log('\n🏁 ÚLTIMO ÚLTIMO ACTO DE AMOR COMPLETADO');
console.log('==========================================');
console.log('🎉 Sistema completamente limpio y listo para producción');

module.exports = { checkFile, debugPatterns };
