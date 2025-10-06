/**
 * 🔍 SCRIPT DE ANÁLISIS DE AUTENTICACIÓN
 * 
 * Escanea todas las APIs y genera un inventario completo de:
 * 1. Patrones de autenticación usados
 * 2. APIs sin protección
 * 3. Niveles de riesgo
 * 4. Plan de migración priorizado
 */

const fs = require('fs');
const path = require('path');

// Configuración
const API_DIR = path.join(__dirname, 'src', 'app', 'api');
const OUTPUT_FILE = path.join(__dirname, 'INVENTARIO_AUTENTICACION.md');

// Patrones a buscar
const PATTERNS = {
  // Sistemas de autenticación
  nextAuth: /import.*getServerSession.*from.*next-auth/,
  customSession: /function getSessionFromCookie|function getSession\(/,
  cookiesDirect: /cookies\(\)\.get\(['"]session['"]\)/,
  
  // Validaciones
  sessionCheck: /if\s*\(\s*!session/,
  roleCheck: /session\.role|session\?\.role/,
  userIdCheck: /session\.userId|session\?\.userId/,
  businessCheck: /session\.businessId|session\?\.businessId/,
  
  // Respuestas de error
  return401: /return.*401|status:\s*401/,
  return403: /return.*403|status:\s*403/,
  unauthorized: /unauthorized|no autorizado/i,
  
  // APIs públicas (sin auth)
  publicEndpoint: /\/api\/(health|manifest|portal\/|debug\/)/,
};

// Contadores globales
const stats = {
  totalAPIs: 0,
  withAuth: 0,
  withoutAuth: 0,
  nextAuth: 0,
  customAuth: 0,
  mixedAuth: 0,
  publicAPIs: 0,
  criticalUnprotected: 0,
  categories: {
    admin: { total: 0, protected: 0 },
    staff: { total: 0, protected: 0 },
    cliente: { total: 0, protected: 0 },
    reservas: { total: 0, protected: 0 },
    promotores: { total: 0, protected: 0 },
    auth: { total: 0, protected: 0 },
    portal: { total: 0, protected: 0 },
    debug: { total: 0, protected: 0 },
    other: { total: 0, protected: 0 }
  }
};

// Inventario detallado
const inventory = {
  nextAuth: [],
  customAuth: [],
  mixedAuth: [],
  noAuth: [],
  publicAPIs: [],
  criticalUnprotected: []
};

/**
 * Escanear recursivamente el directorio de APIs
 */
function scanDirectory(dir, relativePath = '') {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, path.join(relativePath, file));
    } else if (file === 'route.ts' || file === 'route.js') {
      analyzeAPI(fullPath, relativePath);
    }
  }
}

/**
 * Analizar un archivo de API
 */
function analyzeAPI(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const apiPath = `/api/${relativePath}`;
  
  stats.totalAPIs++;
  
  // Detectar categoría
  const category = detectCategory(apiPath);
  stats.categories[category].total++;
  
  // Detectar si es API pública
  if (PATTERNS.publicEndpoint.test(apiPath)) {
    stats.publicAPIs++;
    inventory.publicAPIs.push({
      path: apiPath,
      file: filePath,
      reason: 'API pública por diseño'
    });
    return;
  }
  
  // Detectar sistema de autenticación
  const hasNextAuth = PATTERNS.nextAuth.test(content);
  const hasCustomAuth = PATTERNS.customSession.test(content);
  const hasCookiesDirect = PATTERNS.cookiesDirect.test(content);
  const hasSessionCheck = PATTERNS.sessionCheck.test(content);
  const hasRoleCheck = PATTERNS.roleCheck.test(content);
  const has401 = PATTERNS.return401.test(content);
  const has403 = PATTERNS.return403.test(content);
  
  // Clasificar tipo de autenticación
  const authTypes = [];
  if (hasNextAuth) authTypes.push('NextAuth');
  if (hasCustomAuth) authTypes.push('CustomSession');
  if (hasCookiesDirect) authTypes.push('CookiesDirect');
  
  const authInfo = {
    path: apiPath,
    file: filePath,
    authTypes,
    hasSessionCheck,
    hasRoleCheck,
    has401,
    has403,
    riskLevel: 'BAJO',
    recommendation: ''
  };
  
  // Determinar nivel de protección
  if (authTypes.length === 0) {
    stats.withoutAuth++;
    authInfo.riskLevel = isCriticalEndpoint(apiPath) ? 'CRÍTICO' : 'MEDIO';
    authInfo.recommendation = 'Agregar autenticación';
    
    if (authInfo.riskLevel === 'CRÍTICO') {
      stats.criticalUnprotected++;
      inventory.criticalUnprotected.push(authInfo);
    } else {
      inventory.noAuth.push(authInfo);
    }
  } else {
    stats.withAuth++;
    stats.categories[category].protected++;
    
    if (authTypes.length > 1) {
      stats.mixedAuth++;
      authInfo.riskLevel = 'ALTO';
      authInfo.recommendation = 'Unificar a un solo sistema de auth';
      inventory.mixedAuth.push(authInfo);
    } else if (hasNextAuth) {
      stats.nextAuth++;
      authInfo.recommendation = 'Migrar a middleware unificado';
      inventory.nextAuth.push(authInfo);
    } else {
      stats.customAuth++;
      authInfo.recommendation = 'Migrar a middleware unificado';
      inventory.customAuth.push(authInfo);
    }
  }
}

/**
 * Detectar categoría de la API
 */
function detectCategory(apiPath) {
  if (apiPath.includes('/admin')) return 'admin';
  if (apiPath.includes('/staff')) return 'staff';
  if (apiPath.includes('/cliente')) return 'cliente';
  if (apiPath.includes('/reservas')) return 'reservas';
  if (apiPath.includes('/promotores')) return 'promotores';
  if (apiPath.includes('/auth')) return 'auth';
  if (apiPath.includes('/portal')) return 'portal';
  if (apiPath.includes('/debug')) return 'debug';
  return 'other';
}

/**
 * Determinar si es un endpoint crítico
 */
function isCriticalEndpoint(apiPath) {
  const criticalPatterns = [
    /\/admin\//,
    /\/staff\//,
    /\/users/,
    /\/cliente\/lista/,
    /\/puntos/,
    /\/visitas/,
    /\/canjear/,
    /\/upload/,
    /\/menu/,
    /\/tarjetas/,
  ];
  
  return criticalPatterns.some(pattern => pattern.test(apiPath));
}

/**
 * Generar reporte en Markdown
 */
function generateReport() {
  const lines = [];
  
  lines.push('# 🔐 INVENTARIO COMPLETO DE AUTENTICACIÓN');
  lines.push('');
  lines.push(`**Fecha de análisis:** ${new Date().toLocaleString('es-CO')}`);
  lines.push('');
  
  // Resumen ejecutivo
  lines.push('## 📊 RESUMEN EJECUTIVO');
  lines.push('');
  lines.push('| Métrica | Cantidad | Porcentaje |');
  lines.push('|---------|----------|------------|');
  lines.push(`| **Total de APIs** | ${stats.totalAPIs} | 100% |`);
  lines.push(`| APIs con autenticación | ${stats.withAuth} | ${((stats.withAuth / stats.totalAPIs) * 100).toFixed(1)}% |`);
  lines.push(`| APIs sin autenticación | ${stats.withoutAuth} | ${((stats.withoutAuth / stats.totalAPIs) * 100).toFixed(1)}% |`);
  lines.push(`| APIs públicas (OK) | ${stats.publicAPIs} | ${((stats.publicAPIs / stats.totalAPIs) * 100).toFixed(1)}% |`);
  lines.push(`| 🔴 APIs críticas desprotegidas | ${stats.criticalUnprotected} | ${((stats.criticalUnprotected / stats.totalAPIs) * 100).toFixed(1)}% |`);
  lines.push('');
  
  // Sistemas de autenticación
  lines.push('## 🔧 SISTEMAS DE AUTENTICACIÓN DETECTADOS');
  lines.push('');
  lines.push('| Sistema | Cantidad | Estado |');
  lines.push('|---------|----------|--------|');
  lines.push(`| NextAuth (getServerSession) | ${stats.nextAuth} | ⚠️ A migrar |`);
  lines.push(`| Custom Session (getSessionFromCookie) | ${stats.customAuth} | ⚠️ A migrar |`);
  lines.push(`| Sistemas mixtos | ${stats.mixedAuth} | 🔴 Alto riesgo |`);
  lines.push(`| Middleware unificado (nuevo) | 0 | ✅ Target |`);
  lines.push('');
  
  // Análisis por categoría
  lines.push('## 📂 ANÁLISIS POR CATEGORÍA');
  lines.push('');
  lines.push('| Categoría | Total | Protegidas | % Protección |');
  lines.push('|-----------|-------|------------|--------------|');
  
  for (const [category, data] of Object.entries(stats.categories)) {
    if (data.total > 0) {
      const percentage = ((data.protected / data.total) * 100).toFixed(1);
      const emoji = percentage === '100.0' ? '✅' : percentage >= '80' ? '⚠️' : '🔴';
      lines.push(`| ${emoji} ${category} | ${data.total} | ${data.protected} | ${percentage}% |`);
    }
  }
  lines.push('');
  
  // APIs CRÍTICAS DESPROTEGIDAS
  if (inventory.criticalUnprotected.length > 0) {
    lines.push('## 🚨 PRIORIDAD 1: APIs CRÍTICAS DESPROTEGIDAS');
    lines.push('');
    lines.push('> **¡ACCIÓN INMEDIATA REQUERIDA!** Estas APIs manejan datos sensibles y NO tienen autenticación.');
    lines.push('');
    
    for (const api of inventory.criticalUnprotected) {
      lines.push(`### 🔴 ${api.path}`);
      lines.push('```');
      lines.push(`Archivo: ${api.file}`);
      lines.push(`Riesgo: ${api.riskLevel}`);
      lines.push(`Acción: ${api.recommendation}`);
      lines.push('```');
      lines.push('');
    }
  }
  
  // APIs CON SISTEMAS MIXTOS
  if (inventory.mixedAuth.length > 0) {
    lines.push('## ⚠️ PRIORIDAD 2: APIs CON SISTEMAS MIXTOS');
    lines.push('');
    lines.push('> Estas APIs usan múltiples sistemas de autenticación, lo que puede causar inconsistencias.');
    lines.push('');
    
    for (const api of inventory.mixedAuth) {
      lines.push(`### ⚠️ ${api.path}`);
      lines.push('```');
      lines.push(`Archivo: ${api.file}`);
      lines.push(`Sistemas detectados: ${api.authTypes.join(', ')}`);
      lines.push(`Acción: ${api.recommendation}`);
      lines.push('```');
      lines.push('');
    }
  }
  
  // APIs CON NEXTAUTH
  lines.push('## 📋 APIs USANDO NextAuth (getServerSession)');
  lines.push('');
  lines.push(`**Total:** ${inventory.nextAuth.length} APIs`);
  lines.push('');
  
  for (const api of inventory.nextAuth) {
    lines.push(`- \`${api.path}\``);
  }
  lines.push('');
  
  // APIs CON CUSTOM AUTH
  lines.push('## 📋 APIs USANDO Custom Session');
  lines.push('');
  lines.push(`**Total:** ${inventory.customAuth.length} APIs`);
  lines.push('');
  
  for (const api of inventory.customAuth) {
    lines.push(`- \`${api.path}\``);
  }
  lines.push('');
  
  // APIs SIN PROTECCIÓN (NO CRÍTICAS)
  if (inventory.noAuth.length > 0) {
    lines.push('## 📋 APIs SIN AUTENTICACIÓN (No críticas)');
    lines.push('');
    lines.push(`**Total:** ${inventory.noAuth.length} APIs`);
    lines.push('');
    
    for (const api of inventory.noAuth) {
      lines.push(`- \`${api.path}\` - ${api.recommendation}`);
    }
    lines.push('');
  }
  
  // APIs PÚBLICAS
  lines.push('## ✅ APIs PÚBLICAS (OK)');
  lines.push('');
  lines.push(`**Total:** ${inventory.publicAPIs.length} APIs`);
  lines.push('');
  lines.push('> Estas APIs están diseñadas para ser públicas y NO requieren autenticación.');
  lines.push('');
  
  for (const api of inventory.publicAPIs) {
    lines.push(`- \`${api.path}\` - ${api.reason}`);
  }
  lines.push('');
  
  // PLAN DE MIGRACIÓN
  lines.push('## 🎯 PLAN DE MIGRACIÓN PRIORIZADO');
  lines.push('');
  lines.push('### Fase 1: Emergencia (1-2 días)');
  lines.push(`- Proteger ${stats.criticalUnprotected} APIs críticas desprotegidas`);
  lines.push(`- Unificar ${stats.mixedAuth} APIs con sistemas mixtos`);
  lines.push('');
  lines.push('### Fase 2: Migración NextAuth (3-5 días)');
  lines.push(`- Migrar ${stats.nextAuth} APIs que usan getServerSession`);
  lines.push('- Reemplazar con middleware unificado');
  lines.push('- Agregar tests para cada API migrada');
  lines.push('');
  lines.push('### Fase 3: Migración Custom Auth (3-5 días)');
  lines.push(`- Migrar ${stats.customAuth} APIs con getSessionFromCookie`);
  lines.push('- Eliminar código duplicado');
  lines.push('- Agregar tests');
  lines.push('');
  lines.push('### Fase 4: Limpieza (2-3 días)');
  lines.push('- Eliminar funciones de autenticación antiguas');
  lines.push('- Documentar APIs públicas');
  lines.push(`- Revisar ${inventory.noAuth.length} APIs sin protección`);
  lines.push('');
  
  // BENEFICIOS ESPERADOS
  lines.push('## 💡 BENEFICIOS ESPERADOS');
  lines.push('');
  lines.push('- ✅ **Seguridad:** Todas las APIs críticas protegidas');
  lines.push('- ✅ **Consistencia:** Un solo sistema de autenticación');
  lines.push('- ✅ **Mantenibilidad:** -500 líneas de código duplicado');
  lines.push('- ✅ **Testing:** 100% de cobertura en autenticación');
  lines.push('- ✅ **Auditoría:** Logs centralizados de acceso');
  lines.push('- ✅ **Performance:** Menor overhead por validación');
  lines.push('');
  
  // ESTADÍSTICAS FINALES
  lines.push('## 📈 ESTADÍSTICAS FINALES');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(stats, null, 2));
  lines.push('```');
  lines.push('');
  
  lines.push('---');
  lines.push('');
  lines.push('**Generado automáticamente por:** `analizar-autenticacion.js`');
  lines.push(`**Fecha:** ${new Date().toISOString()}`);
  
  return lines.join('\n');
}

/**
 * Ejecutar análisis
 */
console.log('🔍 Iniciando análisis de autenticación...\n');

try {
  scanDirectory(API_DIR);
  
  const report = generateReport();
  fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');
  
  console.log('✅ Análisis completado!\n');
  console.log(`📊 Total de APIs analizadas: ${stats.totalAPIs}`);
  console.log(`✅ Con autenticación: ${stats.withAuth}`);
  console.log(`⚠️  Sin autenticación: ${stats.withoutAuth}`);
  console.log(`🔴 Críticas desprotegidas: ${stats.criticalUnprotected}`);
  console.log(`\n📄 Reporte guardado en: ${OUTPUT_FILE}`);
  
} catch (error) {
  console.error('❌ Error durante el análisis:', error);
  process.exit(1);
}
