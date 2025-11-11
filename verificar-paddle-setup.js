/**
 * 🔍 SCRIPT: Verificar configuración de Paddle
 * 
 * Este script verifica que todo esté configurado correctamente
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO CONFIGURACIÓN DE PADDLE...\n');

// 1. Verificar package.json
console.log('📦 Verificando dependencias...');
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
  );
  
  const paddleVersion = packageJson.dependencies?.['@paddle/paddle-js'];
  if (paddleVersion) {
    console.log(`✅ @paddle/paddle-js instalado: ${paddleVersion}`);
  } else {
    console.log('❌ @paddle/paddle-js NO encontrado en package.json');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error leyendo package.json:', error.message);
  process.exit(1);
}

// 2. Verificar .env
console.log('\n🔐 Verificando variables de entorno...');
try {
  const envPath = path.join(__dirname, '.env');
  const envLocalPath = path.join(__dirname, '.env.local');
  
  let envContent = '';
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
    console.log('📄 Usando .env.local');
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Usando .env');
  } else {
    console.log('⚠️  No se encontró archivo .env o .env.local');
  }
  
  const hasClientToken = envContent.includes('PADDLE_CLIENT_TOKEN=') && 
                        !envContent.includes('PADDLE_CLIENT_TOKEN=""') &&
                        !envContent.includes('PADDLE_CLIENT_TOKEN=\'\'');
  
  const hasApiKey = envContent.includes('PADDLE_API_KEY=') && 
                   !envContent.includes('PADDLE_API_KEY=""') &&
                   !envContent.includes('PADDLE_API_KEY=\'\'');
  
  const hasWebhook = envContent.includes('PADDLE_WEBHOOK_SECRET=');
  
  console.log(`${hasClientToken ? '✅' : '❌'} PADDLE_CLIENT_TOKEN ${hasClientToken ? 'configurado' : 'NO configurado'}`);
  console.log(`${hasApiKey ? '✅' : '❌'} PADDLE_API_KEY ${hasApiKey ? 'configurado' : 'NO configurado'}`);
  console.log(`${hasWebhook ? '✅' : '⚠️ '} PADDLE_WEBHOOK_SECRET ${hasWebhook ? 'configurado' : 'NO configurado (opcional)'}`);
  
  // Detectar si es sandbox o live
  if (envContent.includes('test_') || envContent.includes('pdl_test_')) {
    console.log('\n🧪 Modo detectado: SANDBOX (test)');
  } else if (envContent.includes('live_') || envContent.includes('pdl_live_')) {
    console.log('\n🔴 Modo detectado: LIVE (producción)');
  } else {
    console.log('\n⚠️  No se pudo detectar el modo (sandbox/live)');
  }
  
} catch (error) {
  console.error('❌ Error leyendo .env:', error.message);
}

// 3. Verificar archivos clave
console.log('\n📁 Verificando archivos de Paddle...');
const keyFiles = [
  'src/hooks/usePaddle.ts',
  'src/lib/paddle.ts',
  'src/app/api/webhooks/paddle/route.ts',
];

keyFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📚 PRÓXIMOS PASOS:\n');
console.log('1. Si NO tienes PADDLE_CLIENT_TOKEN configurado:');
console.log('   → Lee: GUIA_RAPIDA_PADDLE_SANDBOX.md (PASO 3)');
console.log('   → Ve a: https://sandbox-vendors.paddle.com/');
console.log('   → Developer Tools → Authentication → Generate Client Token\n');

console.log('2. Si NO tienes PADDLE_API_KEY configurado:');
console.log('   → Lee: GUIA_RAPIDA_PADDLE_SANDBOX.md (PASO 4)');
console.log('   → Ve a: https://sandbox-vendors.paddle.com/');
console.log('   → Developer Tools → Authentication → Generate API Key\n');

console.log('3. Para probar que funciona:');
console.log('   → Corre: npm run dev');
console.log('   → Visita: http://localhost:3000/pricing');
console.log('   → Intenta hacer un checkout de prueba\n');

console.log('4. Para saltar la verificación en Paddle Retain:');
console.log('   → En lugar de verificar la URL, ve directo a:');
console.log('   → Developer Tools → Authentication → API Keys');
console.log('   → Copia el API Key directamente\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
