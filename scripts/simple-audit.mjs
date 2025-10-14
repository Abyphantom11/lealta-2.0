#!/usr/bin/env node
/**
 * 🔍 AUDITORÍA SIMPLE DE PRODUCCIÓN
 */

console.log('🔍 INICIANDO AUDITORÍA DE PRODUCCIÓN...\n');

import fs from 'fs';
import path from 'path';

// Test básico
console.log('✅ ES modules funcionando');

// Verificar archivos críticos
const criticalFiles = [
  'package.json',
  'next.config.cjs', 
  'tsconfig.json',
  'src/app/layout.tsx'
];

console.log('📁 Verificando archivos críticos...');

for (const file of criticalFiles) {
  try {
    await fs.promises.access(file);
    console.log(`✅ ${file} - OK`);
  } catch {
    console.log(`❌ ${file} - FALTANTE`);
  }
}

// Verificar APIs críticas
console.log('\n🔐 Verificando APIs críticas...');

const criticalApis = [
  'src/app/api/tarjetas/asignar/route.ts',
  'src/app/api/staff/consumo/route.ts',
  'src/middleware/requireAuth.ts'
];

for (const api of criticalApis) {
  try {
    const content = await fs.promises.readFile(api, 'utf8');
    const hasAuth = content.includes('requireAuth') || content.includes('withAuth');
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    
    console.log(`✅ ${api}:`);
    console.log(`   🔐 Auth: ${hasAuth ? '✅' : '❌'}`);
    console.log(`   🛡️ Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
  } catch {
    console.log(`❌ ${api} - No encontrado`);
  }
}

// Verificar package.json
console.log('\n📦 Verificando package.json...');

try {
  const pkg = JSON.parse(await fs.promises.readFile('package.json', 'utf8'));
  
  console.log(`✅ Type: ${pkg.type || 'commonjs'}`);
  console.log(`✅ Scripts de build: ${pkg.scripts?.build ? '✅' : '❌'}`);
  console.log(`✅ Dependencies críticas:`);
  console.log(`   - Next.js: ${pkg.dependencies?.next ? '✅' : '❌'}`);
  console.log(`   - Prisma: ${pkg.dependencies?.['@prisma/client'] ? '✅' : '❌'}`);
  console.log(`   - TypeScript: ${pkg.devDependencies?.typescript ? '✅' : '❌'}`);
  
} catch (error) {
  console.log(`❌ Error leyendo package.json: ${error.message}`);
}

console.log('\n🎯 AUDITORÍA COMPLETADA');
console.log('Para más detalles, revisar cada componente individualmente.');
