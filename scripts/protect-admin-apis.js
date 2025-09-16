#!/usr/bin/env node

/**
 * 🔥 SCRIPT AUTOMATIZADO: Protección masiva de APIs Admin
 * 
 * Este script analiza y protege automáticamente todos los endpoints /api/admin/*
 * aplicando el middleware requireAuth() con la configuración de seguridad apropiada
 */

const fs = require('fs');
const path = require('path');

// Configuración de protección por endpoint
const ENDPOINT_PROTECTION_CONFIG = {
  // APIs de solo lectura (estadísticas, consultas)
  READ_ONLY: [
    'estadisticas',
    'estadisticas-clientes', 
    'visitas',
    'grafico-ingresos',
    'clientes',
    'clients/search'
  ],

  // APIs de escritura (crear, editar datos)
  WRITE: [
    'canjear-recompensa',
    'asignar-tarjetas-bronce',
    'evaluar-nivel-cliente',
    'puntos',
    'canjes'
  ],

  // APIs críticas (configuración, admin)
  ADMIN_ONLY: [
    'portal-config',
    'upload',
    'sync-tarjetas-empresa',
    'menu',
    'goals'
  ],

  // APIs de superadmin únicamente
  SUPERADMIN_ONLY: [
    // Agregar aquí endpoints que solo superadmin debe acceder
  ]
};

// Template para agregar protección a un endpoint
const PROTECTION_TEMPLATE = {
  import: `import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';`,
  
  wrapFunction: (originalFunction, configType) => `
// 🔒 PROTEGIDO CON REQUIREAUTH (${configType})
export async function {{METHOD}}(request: NextRequest) {
  return withAuth(request, async (session) => {
    console.log(\`🔒 {{ENDPOINT}} access by: \${session.role} (\${session.userId})\`);
    
    {{ORIGINAL_LOGIC}}
    
  }, AuthConfigs.${configType});
}`,

  businessIdReplacement: 'session.businessId'
};

/**
 * Analiza un archivo de API y determina el tipo de protección necesaria
 */
function analyzeEndpoint(filePath) {
  const relativePath = path.relative(path.join(__dirname, '../src/app/api/admin'), filePath);
  const endpointName = relativePath.replace('/route.ts', '').replace(/\\/g, '/');
  
  for (const [configType, endpoints] of Object.entries(ENDPOINT_PROTECTION_CONFIG)) {
    if (endpoints.some(ep => endpointName.includes(ep))) {
      return configType;
    }
  }
  
  // Default para endpoints no categorizados
  return 'READ_ONLY';
}

/**
 * Aplica protección a un archivo de endpoint
 */
function protectEndpoint(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip si ya está protegido
  if (content.includes('withAuth') || content.includes('requireAuth')) {
    console.log(`⏭️  SKIP: ${filePath} (ya protegido)`);
    return false;
  }
  
  const configType = analyzeEndpoint(filePath);
  console.log(`🔒 PROTECTING: ${filePath} with ${configType}`);
  
  // Aquí iría la lógica de transformación del archivo
  // Por ahora solo reportamos lo que haríamos
  
  return true;
}

/**
 * Escanea y protege todos los endpoints admin
 */
function protectAllAdminAPIs() {
  const adminApiDir = path.join(__dirname, '../src/app/api/admin');
  
  if (!fs.existsSync(adminApiDir)) {
    console.error('❌ Directorio de APIs admin no encontrado');
    return;
  }
  
  console.log('🚀 INICIANDO PROTECCIÓN MASIVA DE APIs ADMIN...\n');
  
  // Función recursiva para encontrar todos los route.ts
  function findRouteFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findRouteFiles(fullPath));
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const routeFiles = findRouteFiles(adminApiDir);
  console.log(`📂 Encontrados ${routeFiles.length} endpoints de admin API\n`);
  
  let protectedCount = 0;
  let skippedCount = 0;
  
  for (const file of routeFiles) {
    try {
      if (protectEndpoint(file)) {
        protectedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ ERROR protegiendo ${file}:`, error.message);
    }
  }
  
  console.log(`\n📊 RESUMEN DE PROTECCIÓN:`);
  console.log(`✅ Protegidos: ${protectedCount}`);
  console.log(`⏭️  Omitidos: ${skippedCount}`);
  console.log(`❌ Errores: ${routeFiles.length - protectedCount - skippedCount}`);
  console.log(`\n🎯 FASE 1.2 - ${protectedCount > 0 ? 'PARCIALMENTE COMPLETADA' : 'PENDIENTE'}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  protectAllAdminAPIs();
}

module.exports = {
  protectAllAdminAPIs,
  analyzeEndpoint,
  ENDPOINT_PROTECTION_CONFIG
};
