#!/usr/bin/env node
/**
 * 📦 Script para analizar el tamaño del bundle y encontrar optimizaciones
 * 
 * Uso: node analyze-bundle.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Analizando bundle de Next.js...\n');

// 1. Ejecutar build con analyzer
console.log('🔨 Construyendo proyecto con analyzer...');
try {
  execSync('cross-env ANALYZE=true npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, ANALYZE: 'true' }
  });
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
}

// 2. Analizar node_modules
console.log('\n📊 Analizando dependencias pesadas...\n');

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')
);

const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

// Función para obtener tamaño de una dependencia
function getDependencySize(depName) {
  try {
    const depPath = path.join(__dirname, 'node_modules', depName);
    if (!fs.existsSync(depPath)) return 0;
    
    const result = execSync(
      `powershell -Command "Get-ChildItem -Path '${depPath}' -Recurse -File | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum"`,
      { encoding: 'utf-8' }
    );
    
    return parseInt(result.trim());
  } catch {
    return 0;
  }
}

// Analizar tamaños
const depSizes = Object.keys(dependencies).map(dep => ({
  name: dep,
  size: getDependencySize(dep),
  sizeMB: (getDependencySize(dep) / 1024 / 1024).toFixed(2),
})).sort((a, b) => b.size - a.size);

console.log('🔝 Top 15 dependencias más pesadas:\n');
depSizes.slice(0, 15).forEach((dep, index) => {
  if (dep.size > 0) {
    console.log(`${index + 1}. ${dep.name.padEnd(40)} ${dep.sizeMB} MB`);
  }
});

// 3. Recomendaciones
console.log('\n💡 Recomendaciones:\n');

const recommendations = [];

// Revisar react-icons
if (dependencies['react-icons']) {
  const reactIconsSize = depSizes.find(d => d.name === 'react-icons')?.size || 0;
  if (reactIconsSize > 5 * 1024 * 1024) { // > 5MB
    recommendations.push({
      lib: 'react-icons',
      issue: 'Librería muy pesada',
      solution: 'Considerar importar solo los iconos necesarios o usar @iconify/react',
      impact: 'Alto',
    });
  }
}

// Revisar Prisma
if (dependencies['@prisma/client']) {
  recommendations.push({
    lib: '@prisma/client',
    issue: 'Cliente de Prisma en bundle del cliente',
    solution: 'Asegurar que solo se use en server-side (API routes)',
    impact: 'Alto',
  });
}

// Revisar lodash
if (dependencies['lodash']) {
  recommendations.push({
    lib: 'lodash',
    issue: 'Librería completa importada',
    solution: 'Usar lodash-es y tree-shaking, o importar funciones individuales',
    impact: 'Medio',
  });
}

// Revisar moment
if (dependencies['moment']) {
  recommendations.push({
    lib: 'moment',
    issue: 'Moment.js es muy pesado',
    solution: 'Migrar a date-fns o day.js (10x más pequeño)',
    impact: 'Alto',
  });
}

// Mostrar recomendaciones
if (recommendations.length > 0) {
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.lib}`);
    console.log(`   ⚠️  Problema: ${rec.issue}`);
    console.log(`   ✅ Solución: ${rec.solution}`);
    console.log(`   📊 Impacto: ${rec.impact}`);
    console.log('');
  });
} else {
  console.log('✅ No se encontraron problemas obvios\n');
}

// 4. Verificar .next size
console.log('📁 Tamaño del build:\n');
try {
  const nextDir = path.join(__dirname, '.next');
  if (fs.existsSync(nextDir)) {
    const result = execSync(
      `powershell -Command "Get-ChildItem -Path '${nextDir}' -Recurse -File | Measure-Object -Property Length -Sum | Select-Object @{Name='TotalMB';Expression={[math]::Round($_.Sum / 1MB, 2)}}, Count | Format-List"`,
      { encoding: 'utf-8' }
    );
    console.log(result);
  }
} catch (error) {
  console.log('⚠️  No se pudo calcular el tamaño del build');
}

console.log('\n✨ Análisis completado!');
console.log('📊 Revisa los reportes generados en .next/analyze/\n');
