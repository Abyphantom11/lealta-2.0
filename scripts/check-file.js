#!/usr/bin/env node

/**
 * Script para verificar un archivo específico con TypeScript
 */

const { execSync } = require('child_process');
const path = require('path');

const file = process.argv[2] || 'src/app/privacy-policy/page.tsx';

console.log(`🔍 Verificando ${file}...\n`);

try {
  execSync(`npx tsc --noEmit --skipLibCheck ${file}`, { 
    stdio: 'inherit',
    cwd: process.cwd() 
  });
  console.log('✅ Sin errores de TypeScript!');
} catch (error) {
  console.log('❌ Errores encontrados');
  process.exit(1);
}
