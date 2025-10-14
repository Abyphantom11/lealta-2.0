#!/usr/bin/env node

/**
 * 🧹 LIMPIAR SCRIPTS INNECESARIOS
 * 
 * Elimina scripts de diagnóstico temporales que ya cumplieron su propósito
 */

const fs = require('fs');
const path = require('path');

// Scripts que podemos eliminar porque ya cumplieron su propósito
const scriptsParaEliminar = [
  // Scripts de diagnóstico específicos
  'analizar-timezone.js',
  'debug-logica-dia-comercial.js',
  'diagnose-banners-vs-others.js',
  'diagnose-favorito-specific.js',
  'diagnose-fetch-production.js',
  'diagnose-portal-vs-branding.js',
  'diagnose-prod-sync.js',
  'diagnose-production-portal.js',
  'diagnose-banners-production.js',
  'diagnose-business-day-portal.js',
  
  // Scripts de creación temporal de elementos
  'crear-elementos-lunes.js',
  'fix-promociones-favoritos.js',
  'solucion-timezone.js',
  
  // Scripts de prueba específicos
  'test-logica-diaria-produccion.js',
  'test-solucion-localhost.js',
  'verificar-logica-diaria.js',
  'resumen-solucion-final.js',
  'instrucciones-verificacion-produccion.js',
  
  // Scripts de análisis de arrays
  'analyze-production-arrays.js',
  'test-api-config-v2.js',
  
  // Scripts duplicados o redundantes
  'deployment-status-check.js',
  'deployment-status.js'
];

// Scripts importantes que MANTENER
const scriptsImportantes = [
  // Scripts de configuración esenciales
  'create-real-admin-data.js',
  'setup-demo-business.ts',
  'seed-database.js',
  'migrate-json-to-postgresql.mjs',
  
  // Scripts de utilidad general
  'find-golom.js',
  'encontrar-business-id.js',
  'clean-logs.js',
  'optimize-images.js',
  
  // Scripts de tests
  'test-localhost-apis.js',
  'test-production-apis.js',
  'test-all-urls.js',
  
  // Scripts de fixes importantes
  'fix-qr-configuration.js',
  'fix-business-isolation-breach.js'
];

function limpiarScripts() {
  console.log('🧹 LIMPIANDO SCRIPTS INNECESARIOS');
  console.log('='.repeat(50));
  
  console.log('\n📋 Scripts que serán eliminados:');
  console.log('-'.repeat(35));
  
  let eliminados = 0;
  let errores = 0;
  
  for (const script of scriptsParaEliminar) {
    const scriptPath = path.join(__dirname, script);
    
    try {
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
        console.log(`✅ Eliminado: ${script}`);
        eliminados++;
      } else {
        console.log(`⚠️ No existe: ${script}`);
      }
    } catch (error) {
      console.log(`❌ Error eliminando ${script}: ${error.message}`);
      errores++;
    }
  }
  
  console.log('\n📋 Scripts importantes que se mantienen:');
  console.log('-'.repeat(45));
  
  let mantenidos = 0;
  for (const script of scriptsImportantes) {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
      console.log(`🔒 Mantenido: ${script}`);
      mantenidos++;
    }
  }
  
  console.log('\n📊 RESUMEN DE LIMPIEZA:');
  console.log('-'.repeat(25));
  console.log(`✅ Scripts eliminados: ${eliminados}`);
  console.log(`🔒 Scripts importantes mantenidos: ${mantenidos}`);
  console.log(`❌ Errores: ${errores}`);
  
  if (eliminados > 0) {
    console.log('\n🎉 ¡LIMPIEZA COMPLETADA!');
    console.log('✅ Scripts de diagnóstico temporales eliminados');
    console.log('✅ Scripts importantes mantenidos');
    console.log('📁 El proyecto está más organizado');
  }
  
  console.log('\n📝 ARCHIVOS IMPORTANTES QUE QUEDAN:');
  console.log('-'.repeat(40));
  console.log('🔧 Configuración: middleware.ts, next.config.js');
  console.log('📚 Documentación: *.md files');
  console.log('🏗️ Código fuente: src/ directory');
  console.log('🗄️ Base de datos: prisma/ directory');
  console.log('⚙️ Scripts de utilidad general');
}

limpiarScripts();
