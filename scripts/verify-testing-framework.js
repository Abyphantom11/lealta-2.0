const { execSync } = require('child_process');

console.log('🔍 VERIFICANDO ENHANCED TESTING FRAMEWORK...\n');

// 1. Verificar Playwright
try {
  const version = execSync('npx playwright --version', { encoding: 'utf8' });
  console.log('✅ Playwright instalado:', version.trim());
} catch (error) {
  console.log('❌ Playwright no encontrado');
  process.exit(1);
}

// 2. Verificar archivos de test
const fs = require('fs');
const testFiles = [
  'tests/e2e/critical-flows.spec.ts',
  'tests/e2e/demo-framework.spec.ts', 
  'tests/e2e/performance.spec.ts',
  'tests/e2e/test-simple.spec.ts',
  'tests/e2e/page-objects/index.ts',
  'tests/e2e/fixtures/test-data.ts',
  'playwright.config.ts'
];

testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - FALTANTE`);
  }
});

// 3. Verificar scripts NPM
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const testScripts = [
  'test:e2e',
  'test:e2e:critical', 
  'test:e2e:mobile',
  'test:e2e:chrome',
  'test:e2e:report'
];

console.log('\n📋 Scripts de testing disponibles:');
testScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    console.log(`✅ npm run ${script}`);
  } else {
    console.log(`❌ npm run ${script} - FALTANTE`);
  }
});

// 4. Verificar puerto disponible
try {
  const netstat = execSync('netstat -an', { encoding: 'utf8' });
  if (netstat.includes(':3001')) {
    console.log('\n✅ Puerto 3001: OCUPADO (servidor corriendo)');
  } else {
    console.log('\n⚠️  Puerto 3001: LIBRE (ejecutar: npm run dev)');
  }
} catch (error) {
  console.log('\n❓ No se pudo verificar puerto 3001');
}

console.log('\n🚀 PASOS PARA PROBAR:');
console.log('1. npm run dev (en terminal separada)');
console.log('2. npx playwright test tests/e2e/test-simple.spec.ts --project=chromium');
console.log('3. npx playwright test tests/e2e/demo-framework.spec.ts --project=chromium');
console.log('4. npx playwright show-report');

console.log('\n✨ Enhanced Testing Framework LISTO para usar!');
