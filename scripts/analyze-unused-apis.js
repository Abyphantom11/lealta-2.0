// Script para analizar APIs potencialmente innecesarias
import fs from 'fs';

console.log('🧹 ANÁLISIS DE APIs INNECESARIAS - LEALTA 2.0');
console.log('=' .repeat(50));

// APIs que son claramente de testing/debug
const testingApis = [
  'src/app/api/debug/connection/route.ts',
  'src/app/api/debug/test-upload/route.ts', 
  'src/app/api/debug/simple-auth/route.ts',
  'src/app/api/debug/migrate-seed/route.ts',
  'src/app/api/debug/fix-progress/route.ts',
  'src/app/api/debug/clientes/route.ts',
  'src/app/api/debug/config-status/route.ts',
  'src/app/api/debug/cliente-progress/route.ts',
  'src/app/api/debug/businesses/route.ts',
  'src/app/api/debug/banners/route.ts',
  'src/app/api/debug/env/route.ts',
  'src/app/api/staff/test-gemini/route.ts',
  'src/app/api/reservas/test-qr/route.ts',
  'src/app/api/cliente/test-visitas-business/route.ts',
  'src/app/api/admin/migrate-json-to-db/route.ts',
  'src/app/api/admin/migrate-clientes/route.ts'
];

// APIs duplicadas o con funcionalidad similar
const duplicatedApis = [
  { 
    group: 'Portal Config',
    apis: [
      'src/app/api/portal/config/route.ts',
      'src/app/api/portal/config-v2/route.ts',
      'src/app/api/admin/portal-config/route.ts'
    ],
    recommendation: 'Unificar en una sola API de configuración'
  },
  {
    group: 'QR Scanning',
    apis: [
      'src/app/api/reservas/scan-qr/route.ts',
      'src/app/api/reservas/qr-scan/route.ts',
      'src/app/api/reservas/scanner/route.ts'
    ],
    recommendation: 'Consolidar en una sola API de escaneo QR'
  },
  {
    group: 'Menu Management',
    apis: [
      'src/app/api/menu/productos/route.ts',
      'src/app/api/admin/menu/productos/route.ts'
    ],
    recommendation: 'Usar solo la versión admin con permisos'
  }
];

console.log('❌ APIS DE TESTING/DEBUG PARA ELIMINAR:');
console.log('(Safe to remove in production)');
testingApis.forEach((api, index) => {
  const exists = fs.existsSync(api);
  console.log(`${index + 1}. ${api} ${exists ? '✅' : '❌'}`);
});

console.log('\n⚠️  APIS DUPLICADAS PARA CONSOLIDAR:');
duplicatedApis.forEach((group, index) => {
  console.log(`\n${index + 1}. ${group.group}:`);
  group.apis.forEach(api => {
    const exists = fs.existsSync(api);
    console.log(`   - ${api} ${exists ? '✅' : '❌'}`);
  });
  console.log(`   💡 ${group.recommendation}`);
});

// Analizar APIs no utilizadas en frontend
console.log('\n🔍 VERIFICANDO USOS EN FRONTEND...');

const frontendFiles = [
  'src/app/staff/page.tsx',
  'src/app/[businessId]/staff/StaffPageContent-full.tsx',
  'src/app/superadmin/SuperAdminDashboard.tsx',
  'src/components/**/*.tsx'
];

const commonUnusedApis = [
  '/api/analytics/process-pos',
  '/api/branding/upload', 
  '/api/setup/business-routing',
  '/api/metrics',
  '/api/notificaciones/actualizar-clientes'
];

console.log('APIs potencialmente no utilizadas:');
commonUnusedApis.forEach((api, index) => {
  console.log(`${index + 1}. ${api} - Verificar uso manual`);
});

console.log('\n📊 RESUMEN:');
console.log(`📁 APIs de testing para eliminar: ${testingApis.length}`);
console.log(`🔄 Grupos de APIs duplicadas: ${duplicatedApis.length}`);
console.log(`❓ APIs potencialmente no usadas: ${commonUnusedApis.length}`);

console.log('\n🎯 RECOMENDACIONES:');
console.log('1. Eliminar todas las APIs de /debug/ y test-* en producción');
console.log('2. Consolidar APIs duplicadas según las recomendaciones');
console.log('3. Verificar manualmente el uso de APIs listadas como "no usadas"');
console.log('4. Crear script de cleanup automático para futuras eliminaciones');

console.log('\n💾 SCRIPT DE CLEANUP SUGERIDO:');
console.log('```bash');
console.log('# Eliminar APIs de debug/testing');
console.log('rm -rf src/app/api/debug/');
console.log('find src/app/api -name "*test*" -type f -delete');
console.log('rm src/app/api/admin/migrate-*');
console.log('```');
