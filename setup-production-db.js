#!/usr/bin/env node
/**
 * 🚀 VERCEL DATABASE SETUP - Configuración completa de producción
 * 
 * Este script asegura que la base de datos esté completamente configurada
 */

const { execSync } = require('child_process');

console.log('🚀 INICIANDO SETUP COMPLETO DE BASE DE DATOS...');

try {
  // 1. Generar Prisma Client
  console.log('📦 Generando Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // 2. Aplicar schema a la base de datos
  console.log('🗄️  Aplicando schema a la base de datos...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  
  console.log('✅ Setup de base de datos completado!');
  console.log('');
  console.log('🎯 PRÓXIMOS PASOS:');
  console.log('1. Visitar: https://lealta.app/api/debug/migrate-seed (POST)');
  console.log('2. Luego probar login con:');
  console.log('   - Email: arepa@gmail.com');
  console.log('   - Password: 123456');
  
} catch (error) {
  console.error('❌ Error en setup:', error.message);
  console.log('');
  console.log('🔧 SOLUCIONES:');
  console.log('1. Verificar que DATABASE_URL esté configurada');
  console.log('2. Verificar que la base de datos esté accesible');
  console.log('3. Ejecutar manualmente en Vercel Functions:');
  console.log('   - npx prisma generate');
  console.log('   - npx prisma db push --accept-data-loss');
}
