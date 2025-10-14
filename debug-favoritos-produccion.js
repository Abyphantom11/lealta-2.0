/**
 * 🔍 Script para verificar favoritos del día en producción
 */

console.log('🔍 Verificando favoritos del día en la base de datos...\n');

// 1. Verificar si existen favoritos en la tabla
const checkFavoritos = `
SELECT 
  id, 
  "businessId", 
  "productName", 
  dia, 
  active, 
  "createdAt"
FROM "PortalFavoritoDelDia" 
WHERE "businessId" = 'cafedani'
ORDER BY "createdAt" DESC;
`;

// 2. Verificar configuración total del portal
const checkPortalConfig = `
SELECT 
  "businessId",
  (SELECT COUNT(*) FROM "PortalBanner" WHERE "businessId" = pc."businessId") as banners_count,
  (SELECT COUNT(*) FROM "PortalPromocion" WHERE "businessId" = pc."businessId") as promociones_count,
  (SELECT COUNT(*) FROM "PortalRecompensa" WHERE "businessId" = pc."businessId") as recompensas_count,
  (SELECT COUNT(*) FROM "PortalFavoritoDelDia" WHERE "businessId" = pc."businessId") as favoritos_count,
  (SELECT COUNT(*) FROM "PortalFavoritoDelDia" WHERE "businessId" = pc."businessId" AND active = true) as favoritos_activos_count
FROM "PortalConfig" pc
WHERE pc."businessId" = 'cafedani';
`;

console.log('📋 Queries a ejecutar en la base de datos:');
console.log('\n1. Favoritos del día:');
console.log(checkFavoritos);
console.log('\n2. Resumen de configuración del portal:');
console.log(checkPortalConfig);

console.log('\n💡 POSIBLES CAUSAS DEL PROBLEMA:');
console.log('1. ❌ No hay favoritos del día creados en la tabla PortalFavoritoDelDia');
console.log('2. ❌ Los favoritos están inactivos (active = false)');
console.log('3. ❌ Los favoritos no coinciden con el businessId correcto');
console.log('4. ❌ Los favoritos no están configurados para el día actual');

console.log('\n🔧 SOLUCIÓN RÁPIDA:');
console.log('Si no hay datos, ejecuta el script para añadir favoritos de prueba o verifica que el admin haya configurado favoritos del día.');
