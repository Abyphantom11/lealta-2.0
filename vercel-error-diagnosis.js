/**
 * 🚨 VERCEL ERROR DIAGNOSIS - Lealta 2.0
 * 
 * Errores comunes detectados en Vercel deployments:
 * 1. Prisma Client no generado
 * 2. Variables de entorno faltantes
 * 3. Build dependencies incorrectas
 * 4. Database connection failures
 */

console.log('🔍 INICIANDO DIAGNÓSTICO DE ERRORES VERCEL...');

// 1. Verificar variables de entorno críticas
const requiredEnvs = [
  'DATABASE_URL',
  'NEXTAUTH_URL', 
  'NEXTAUTH_SECRET',
  'NODE_ENV'
];

console.log('📋 Variables de entorno requeridas:');
requiredEnvs.forEach(env => {
  const value = process.env[env];
  console.log(`${env}: ${value ? '✅ CONFIGURADA' : '❌ FALTANTE'}`);
});

// 2. Verificar conexión a base de datos
if (process.env.DATABASE_URL) {
  console.log('🗄️  Database URL configurada:', process.env.DATABASE_URL.substring(0, 50) + '...');
} else {
  console.log('❌ DATABASE_URL no configurada - ESTO CAUSARÁ ERRORES');
}

// 3. Verificar Prisma
try {
  console.log('🔍 Verificando Prisma...');
  const { PrismaClient } = require('@prisma/client');
  console.log('✅ Prisma Client importado correctamente');
} catch (error) {
  console.log('❌ Error con Prisma Client:', error.message);
}

console.log('\n🎯 SOLUCIONES SUGERIDAS:');
console.log('1. Configurar DATABASE_URL en Vercel Environment Variables');
console.log('2. Asegurar que postinstall ejecute "prisma generate"');
console.log('3. Verificar que build command incluya Prisma generation');
console.log('4. Revisar logs específicos en Vercel Dashboard');
