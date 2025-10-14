const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO READINESS PARA CI/CD...\n');

// 1. Verificar archivos de GitHub Actions
const workflowsDir = '.github/workflows';
const requiredWorkflows = [
  'ci-cd-pipeline.yml',
  'simple-ci-cd.yml'
];

console.log('📁 GitHub Actions Workflows:');
if (fs.existsSync(workflowsDir)) {
  requiredWorkflows.forEach(workflow => {
    const filePath = path.join(workflowsDir, workflow);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${workflow}`);
    } else {
      console.log(`❌ ${workflow} - FALTANTE`);
    }
  });
} else {
  console.log('❌ Directorio .github/workflows no existe');
}

// 2. Verificar scripts NPM necesarios
console.log('\n📋 Scripts NPM para CI/CD:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
  'build',
  'test',
  'lint',
  'typecheck',
  'test:e2e',
  'test:e2e:ci',
  'ci:quality-gates'
];

requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ npm run ${script}`);
  } else {
    console.log(`❌ npm run ${script} - FALTANTE`);
  }
});

// 3. Verificar configuración de Playwright
console.log('\n🧪 Configuración de Testing:');
const playwrightConfigs = [
  'playwright.config.ts',
  'playwright.config.production.ts'
];

playwrightConfigs.forEach(config => {
  if (fs.existsSync(config)) {
    console.log(`✅ ${config}`);
  } else {
    console.log(`❌ ${config} - FALTANTE`);
  }
});

// 4. Verificar tests E2E
console.log('\n🧪 Tests E2E disponibles:');
const testsDir = 'tests/e2e';
if (fs.existsSync(testsDir)) {
  const testFiles = fs.readdirSync(testsDir).filter(file => file.endsWith('.spec.ts'));
  console.log(`✅ ${testFiles.length} archivos de test encontrados:`);
  testFiles.forEach(file => console.log(`   • ${file}`));
} else {
  console.log('❌ Directorio tests/e2e no existe');
}

// 5. Verificar configuración de Vercel
console.log('\n🚀 Configuración de Deploy:');
const vercelConfig = '.vercel/project.json';
if (fs.existsSync(vercelConfig)) {
  try {
    const config = JSON.parse(fs.readFileSync(vercelConfig, 'utf8'));
    console.log('✅ Vercel configurado:');
    console.log(`   • Org ID: ${config.orgId || 'NO ENCONTRADO'}`);
    console.log(`   • Project ID: ${config.projectId || 'NO ENCONTRADO'}`);
  } catch (error) {
    console.log('❌ Error leyendo configuración de Vercel');
  }
} else {
  console.log('⚠️  Vercel no configurado (ejecutar: npx vercel link)');
}

// 6. Verificar dependencias críticas
console.log('\n📦 Dependencias críticas:');
const criticalDeps = [
  '@playwright/test',
  'next',
  'typescript'
];

criticalDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - NO INSTALADO`);
  }
});

console.log('\n🎯 RESUMEN DE READINESS:');

const hasWorkflows = fs.existsSync(workflowsDir) && 
  requiredWorkflows.every(w => fs.existsSync(path.join(workflowsDir, w)));

const hasScripts = requiredScripts.every(script => packageJson.scripts[script]);

const hasPlaywright = playwrightConfigs.every(config => fs.existsSync(config));

const hasTests = fs.existsSync(testsDir) && 
  fs.readdirSync(testsDir).some(file => file.endsWith('.spec.ts'));

const hasVercel = fs.existsSync(vercelConfig);

const readinessScore = [hasWorkflows, hasScripts, hasPlaywright, hasTests, hasVercel]
  .filter(Boolean).length;

console.log(`📊 Readiness Score: ${readinessScore}/5`);

if (readinessScore === 5) {
  console.log('🎉 ¡PERFECTO! Tu proyecto está 100% listo para CI/CD');
  console.log('🚀 Próximo paso: Configurar secrets en GitHub y hacer push');
} else if (readinessScore >= 4) {
  console.log('✅ Tu proyecto está casi listo para CI/CD');
  console.log('🔧 Solo necesitas configurar algunos detalles');
} else {
  console.log('⚠️  Tu proyecto necesita algunas configuraciones adicionales');
}

console.log('\n📋 PRÓXIMOS PASOS:');
console.log('1. Configurar Vercel (si no está): npx vercel link');
console.log('2. Configurar GitHub Secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)');
console.log('3. Push a GitHub para activar CI/CD: git push origin main');
console.log('4. Ver magia automática en GitHub Actions! ✨');
