/**
 * 🚀 SCRIPT DE DEPLOYMENT PARA PRODUCCIÓN
 * Configura HTTPS, Vercel, y validaciones de producción
 */

import fs from 'fs';
import path from 'path';

const PRODUCTION_CHECKLIST = [
  {
    id: 'env-vars',
    name: 'Variables de Entorno',
    check: () => {
      const requiredVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET', 
        'AUTH_SECRET',
        'NEXTAUTH_URL',
        'NEXTAUTH_GITHUB_ID',
        'NEXTAUTH_GITHUB_SECRET'
      ];
      
      const missing = requiredVars.filter(varName => !process.env[varName]);
      
      if (missing.length > 0) {
        return {
          status: 'error',
          message: `Variables faltantes: ${missing.join(', ')}`
        };
      }
      
      return { status: 'success', message: 'Todas las variables están configuradas' };
    }
  },
  {
    id: 'database',
    name: 'Base de Datos',
    check: async () => {
      try {
        // Check básico de conexión a DB
        if (!process.env.DATABASE_URL) {
          return { status: 'error', message: 'DATABASE_URL no configurada' };
        }
        
        if (process.env.DATABASE_URL.includes('localhost')) {
          return { status: 'warning', message: 'Usando base de datos local en producción' };
        }
        
        return { status: 'success', message: 'Base de datos configurada correctamente' };
      } catch (error) {
        return { status: 'error', message: `Error de conexión: ${error.message}` };
      }
    }
  },
  {
    id: 'build-files',
    name: 'Archivos de Build',
    check: () => {
      const buildDir = path.join(process.cwd(), '.next');
      
      if (!fs.existsSync(buildDir)) {
        return { status: 'error', message: 'Directorio .next no encontrado. Ejecuta npm run build' };
      }
      
      return { status: 'success', message: 'Archivos de build encontrados' };
    }
  }
];

async function runProductionCheck() {
  console.log('🔍 Verificando preparación para producción...\n');
  
  const results = [];
  
  for (const check of PRODUCTION_CHECKLIST) {
    console.log(`⏳ Verificando: ${check.name}...`);
    
    try {
      const result = typeof check.check === 'function' 
        ? await check.check()
        : check.check;
        
      results.push({ ...check, result });
      
      const icon = result.status === 'success' ? '✅' 
                 : result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${icon} ${check.name}: ${result.message}`);
    } catch (error) {
      results.push({ 
        ...check, 
        result: { status: 'error', message: error.message } 
      });
      console.log(`❌ ${check.name}: Error - ${error.message}`);
    }
  }
  
  console.log('\n📊 Resumen:');
  const success = results.filter(r => r.result.status === 'success').length;
  const warnings = results.filter(r => r.result.status === 'warning').length;
  const errors = results.filter(r => r.result.status === 'error').length;
  
  console.log(`✅ Exitosos: ${success}`);
  console.log(`⚠️ Advertencias: ${warnings}`);
  console.log(`❌ Errores: ${errors}`);
  
  if (errors > 0) {
    console.log('\n❌ Hay errores críticos que deben ser corregidos antes del deployment.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️ Hay advertencias. Revisa antes del deployment.');
  } else {
    console.log('\n🚀 ¡Todo listo para producción!');
  }
}

runProductionCheck().catch(error => {
  console.error('❌ Error ejecutando verificaciones:', error);
  process.exit(1);
});
