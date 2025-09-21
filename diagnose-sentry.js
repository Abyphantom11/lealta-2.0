// Verificación de configuración de Sentry
console.log('=== DIAGNÓSTICO DE SENTRY ===\n');

// 1. Verificar variables de entorno
console.log('1. Variables de entorno:');
console.log('   NEXT_PUBLIC_SENTRY_DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ Configurado' : '❌ No configurado');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  console.log('   DSN (truncado):', process.env.NEXT_PUBLIC_SENTRY_DSN.substring(0, 50) + '...');
}

// 2. Verificar archivos de configuración
const fs = require('fs');
const path = require('path');

console.log('\n2. Archivos de configuración:');

const configFiles = [
  'sentry.client.config.js',
  'sentry.server.config.js', 
  'sentry.edge.config.js',
  'src/instrumentation.ts'
];

configFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`   ${file}: ✅ Existe`);
  } else {
    console.log(`   ${file}: ❌ No existe`);
  }
});

// 3. Verificar package.json
console.log('\n3. Dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const sentryVersion = packageJson.dependencies?.['@sentry/nextjs'] || 'No instalado';
  console.log('   @sentry/nextjs:', sentryVersion);
} catch (error) {
  console.log('   Error leyendo package.json:', error.message);
}

console.log('\n=== RECOMENDACIONES ===');
console.log('1. Reinicia el servidor de desarrollo: npm run dev');
console.log('2. Revisa la consola del navegador en la página de test');
console.log('3. Verifica que no haya errores en la inicialización');
console.log('4. Comprueba que el DSN sea válido en Sentry.io');
