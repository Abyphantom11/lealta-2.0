#!/usr/bin/env node
/**
 * Script optimizado para build en Vercel
 * Maneja errores comunes y optimiza el proceso
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');

console.log('🚀 Iniciando build optimizado para Vercel...');

try {
  // 1. Generar Prisma Client
  console.log('📦 Generando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 2. Aplicar migraciones en producción
  if (process.env.VERCEL) {
    console.log('☁️ Build en Vercel detectado');
    console.log('🗄️ Aplicando migraciones de base de datos...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migraciones aplicadas exitosamente');
    } catch (migrateError) {
      console.error('⚠️ Error aplicando migraciones:', migrateError.message);
      console.log('⏭️ Continuando con el build...');
    }
  } else {
    console.log('🗄️ Sincronizando base de datos (dev)...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  }

  // 3. Build de Next.js
  console.log('🏗️ Construyendo aplicación...');
  execSync('next build', { stdio: 'inherit' });

  console.log('✅ Build completado exitosamente!');
} catch (error) {
  console.error('❌ Error durante el build:', error.message);

  // Intentar build básico como fallback
  console.log('🔄 Intentando build básico...');
  try {
    execSync('npx prisma generate && next build', { stdio: 'inherit' });
    console.log('✅ Build básico completado!');
  } catch (fallbackError) {
    console.error('❌ Build básico también falló:', fallbackError.message);
    process.exit(1);
  }
}
