#!/usr/bin/env node
/**
 * ✅ Script de verificación de optimizaciones
 * 
 * Verifica qué optimizaciones están implementadas y cuáles faltan
 * 
 * Uso: node check-optimizations.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando optimizaciones implementadas...\n');

const checks = [];

// 1. Verificar next.config.js
console.log('📝 Verificando next.config.js...');
try {
  const configContent = fs.readFileSync(
    path.join(__dirname, 'next.config.js'),
    'utf-8'
  );

  checks.push({
    name: 'Optimización de imágenes activada',
    status: configContent.includes('unoptimized: false') || 
            !configContent.includes('unoptimized: true'),
    category: 'Imágenes',
  });

  checks.push({
    name: 'Formatos modernos (WebP/AVIF)',
    status: configContent.includes('image/avif') && configContent.includes('image/webp'),
    category: 'Imágenes',
  });

  checks.push({
    name: 'Cache de imágenes optimizado',
    status: configContent.includes('minimumCacheTTL'),
    category: 'Cache',
  });

  checks.push({
    name: 'Cache headers para iconos',
    status: configContent.includes('/icons/:path*'),
    category: 'Cache',
  });

  checks.push({
    name: 'SWC minify activado',
    status: configContent.includes('swcMinify: true'),
    category: 'Bundle',
  });

  checks.push({
    name: 'Webpack optimization',
    status: configContent.includes('config.optimization.minimize'),
    category: 'Bundle',
  });
} catch (error) {
  console.log('❌ Error leyendo next.config.js');
}

// 2. Verificar @vercel/blob
console.log('📝 Verificando dependencias...');
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')
  );

  checks.push({
    name: 'Vercel Blob instalado',
    status: packageJson.dependencies?.['@vercel/blob'] !== undefined ||
            packageJson.devDependencies?.['@vercel/blob'] !== undefined,
    category: 'Blob Storage',
    required: false,
  });

  checks.push({
    name: 'Sharp instalado (optimización imágenes)',
    status: packageJson.dependencies?.['sharp'] !== undefined ||
            packageJson.devDependencies?.['sharp'] !== undefined,
    category: 'Imágenes',
  });

  checks.push({
    name: 'Bundle analyzer instalado',
    status: packageJson.devDependencies?.['@next/bundle-analyzer'] !== undefined,
    category: 'Bundle',
  });
} catch (error) {
  console.log('❌ Error leyendo package.json');
}

// 3. Verificar tamaño de public/uploads
console.log('📝 Verificando archivos estáticos...');
try {
  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir, { recursive: true });
    const totalFiles = files.filter(f => {
      const fullPath = path.join(uploadsDir, f);
      return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
    }).length;

    checks.push({
      name: `Archivos en /public/uploads (${totalFiles} archivos)`,
      status: totalFiles < 10,
      category: 'Assets',
      warning: totalFiles >= 10 ? 'Considerar migrar a Blob Storage' : null,
    });
  }
} catch (error) {
  console.log('⚠️  No se pudo verificar /public/uploads');
}

// 4. Verificar si existe blob-upload.ts
console.log('📝 Verificando utilidades de blob...');
const blobUtilPath = path.join(__dirname, 'src', 'lib', 'blob-upload.ts');
checks.push({
  name: 'Utilidad de blob-upload creada',
  status: fs.existsSync(blobUtilPath),
  category: 'Blob Storage',
  required: false,
});

// Agrupar y mostrar resultados
console.log('\n📊 Resultados:\n');

const categories = [...new Set(checks.map(c => c.category))];

categories.forEach(category => {
  console.log(`\n🏷️  ${category}:`);
  
  const categoryChecks = checks.filter(c => c.category === category);
  categoryChecks.forEach(check => {
    const icon = check.status ? '✅' : (check.required === false ? '⚠️' : '❌');
    console.log(`   ${icon} ${check.name}`);
    if (check.warning) {
      console.log(`      💡 ${check.warning}`);
    }
  });
});

// Resumen
const total = checks.length;
const completed = checks.filter(c => c.status).length;
const optional = checks.filter(c => c.required === false).length;
const required = total - optional;
const requiredCompleted = checks.filter(c => c.status && c.required !== false).length;

console.log('\n' + '='.repeat(60));
console.log('📈 Resumen:');
console.log(`   Total verificaciones: ${total}`);
console.log(`   Completadas: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
console.log(`   Requeridas completadas: ${requiredCompleted}/${required}`);
console.log(`   Opcionales completadas: ${completed - requiredCompleted}/${optional}`);
console.log('='.repeat(60));

// Siguientes pasos
console.log('\n📋 Siguientes pasos recomendados:\n');

const nextSteps = [];

if (!checks.find(c => c.name.includes('Sharp instalado'))?.status) {
  nextSteps.push('1. Instalar Sharp: npm install sharp');
}

if (!checks.find(c => c.name.includes('Bundle analyzer'))?.status) {
  nextSteps.push('2. Instalar Bundle Analyzer: npm install --save-dev @next/bundle-analyzer');
}

const uploadsCheck = checks.find(c => c.name.includes('Archivos en /public/uploads'));
if (uploadsCheck && !uploadsCheck.status) {
  nextSteps.push('3. Ejecutar optimize-images.js para comprimir imágenes');
  nextSteps.push('4. Considerar migración a Vercel Blob Storage');
}

if (!checks.find(c => c.name.includes('Vercel Blob'))?.status) {
  nextSteps.push('5. Instalar Vercel Blob: npm install @vercel/blob');
  nextSteps.push('6. Crear utilidad blob-upload.ts');
  nextSteps.push('7. Migrar uploads a Blob Storage');
}

nextSteps.push('8. Ejecutar analyze-bundle.js para revisar tamaño del bundle');
nextSteps.push('9. Hacer deploy y monitorear métricas en Vercel Analytics');

if (nextSteps.length > 0) {
  nextSteps.forEach(step => console.log(`   ${step}`));
} else {
  console.log('   ✅ Todas las optimizaciones básicas están implementadas!');
  console.log('   💡 Revisa GUIA_OPTIMIZACION_IMPLEMENTACION.md para optimizaciones avanzadas');
}

console.log('\n✨ Verificación completada!\n');
