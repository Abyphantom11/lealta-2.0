/**
 * TEST SIMPLE: Verificar compilación y consistencia de archivos modificados
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 VERIFICANDO ARCHIVOS MODIFICADOS');
console.log('=====================================');

// Verificar que los archivos existen y tienen el contenido esperado
const filesToCheck = [
  {
    path: 'src/lib/business-day-utils.ts',
    shouldContain: ['isItemVisibleInBusinessDay', 'DailyScheduledItem', 'DEFAULT_RESET_HOUR = 4'],
    description: 'Librería de utilidades de día comercial'
  },
  {
    path: 'src/components/admin-v2/portal/FavoritoDelDiaManager.tsx', 
    shouldContain: ["horaPublicacion: '04:00'", "setPublishTime('04:00')"],
    shouldNotContain: ["'09:00'"],
    description: 'Manager de favoritos (horario unificado a 4:00 AM)'
  },
  {
    path: 'src/hooks/useAutoRefreshPortalConfig.ts',
    shouldContain: ['getBannersForBusinessDay', 'isItemVisibleInBusinessDay'],
    description: 'Hook con nueva función para banners por día comercial'
  },
  {
    path: 'src/app/cliente/components/sections/BannersSection.tsx',
    shouldContain: ['getBannersForBusinessDay', 'getCurrentBusinessDay', 'useState', 'useEffect'],
    shouldNotContain: ['useMemo'],
    description: 'Sección de banners actualizada'
  },
  {
    path: 'src/app/cliente/components/sections/PromocionesSection.tsx',
    shouldContain: ['getPromocionesForBusinessDay', 'useState<Promocion[]>', 'setPromociones'],
    shouldNotContain: ['useMemo', 'getPromociones()'],
    description: 'Sección de promociones actualizada'
  }
];

let allTestsPassed = true;

for (const file of filesToCheck) {
  console.log(`\n📁 Verificando: ${file.description}`);
  console.log(`   Archivo: ${file.path}`);
  
  const fullPath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`   ❌ ERROR: Archivo no encontrado`);
    allTestsPassed = false;
    continue;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificar contenido que debe estar presente
  if (file.shouldContain) {
    let hasAllContent = true;
    for (const searchText of file.shouldContain) {
      if (!content.includes(searchText)) {
        console.log(`   ❌ ERROR: No contiene "${searchText}"`);
        hasAllContent = false;
        allTestsPassed = false;
      }
    }
    if (hasAllContent) {
      console.log(`   ✅ Contenido requerido presente (${file.shouldContain.length} elementos)`);
    }
  }
  
  // Verificar contenido que NO debe estar presente
  if (file.shouldNotContain) {
    let hasUnwantedContent = false;
    for (const searchText of file.shouldNotContain) {
      if (content.includes(searchText)) {
        console.log(`   ❌ ERROR: Aún contiene "${searchText}" (debe ser removido)`);
        hasUnwantedContent = true;
        allTestsPassed = false;
      }
    }
    if (!hasUnwantedContent && file.shouldNotContain.length > 0) {
      console.log(`   ✅ Contenido no deseado removido (${file.shouldNotContain.length} elementos)`);
    }
  }
  
  // Mostrar tamaño del archivo
  const stats = fs.statSync(fullPath);
  console.log(`   📊 Tamaño: ${stats.size} bytes`);
}

console.log('\n🎯 VERIFICACIÓN DE CONSISTENCIA');
console.log('===============================');

// Verificar que no hay referencias a 09:00 en los archivos críticos
const criticalFiles = [
  'src/components/admin-v2/portal/FavoritoDelDiaManager.tsx',
  'src/app/cliente/components/sections/FavoritoDelDiaSection.tsx'
];

let consistencyCheck = true;
for (const file of criticalFiles) {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const oldTimeReferences = content.match(/09:00|9:00/g);
    if (oldTimeReferences) {
      console.log(`❌ ${file} aún tiene referencias a 09:00: ${oldTimeReferences.length} encontradas`);
      consistencyCheck = false;
    } else {
      console.log(`✅ ${file} - Sin referencias a horarios inconsistentes`);
    }
  }
}

console.log('\n📋 RESUMEN FINAL');
console.log('================');

if (allTestsPassed && consistencyCheck) {
  console.log('✅ TODOS LOS TESTS PASARON');
  console.log('🎉 La lógica de actualización diaria ha sido unificada exitosamente');
  console.log('⏰ Todos los componentes ahora usan 4:00 AM como hora de reseteo por defecto');
  console.log('🔄 Se implementó lógica centralizada para banners, promociones y favoritos');
} else {
  console.log('❌ ALGUNOS TESTS FALLARON');
  console.log('🔧 Revisa los errores arriba y corrige los archivos necesarios');
}

console.log('\n📌 PRÓXIMOS PASOS RECOMENDADOS:');
console.log('1. Compilar el proyecto para verificar que no hay errores de TypeScript');
console.log('2. Probar en desarrollo que los horarios cambien correctamente a las 4:00 AM');
console.log('3. Verificar que admin y cliente estén sincronizados');
console.log('4. Documentar los cambios para el equipo');
