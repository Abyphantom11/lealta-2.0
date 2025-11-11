/**
 * 🧪 SCRIPT: Probar que Paddle funcione completamente
 * 
 * Este script verifica:
 * 1. Credenciales configuradas
 * 2. Conexión con Paddle API
 * 3. Paddle.js instalado
 * 4. Productos/Precios existentes
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 VERIFICANDO QUE PADDLE FUNCIONE...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Cargar variables de entorno
function loadEnv() {
  const envLocalPath = path.join(__dirname, '.env.local');
  const envPath = path.join(__dirname, '.env');
  
  let envContent = '';
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  } else if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const env = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remover comillas
      value = value.replace(/^["']|["']$/g, '');
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnv();

// ═══════════════════════════════════════════════════════════
// TEST 1: Verificar que las credenciales estén configuradas
// ═══════════════════════════════════════════════════════════
console.log('📋 TEST 1: Credenciales configuradas\n');

const checks = {
  clientToken: {
    key: 'PADDLE_CLIENT_TOKEN',
    value: env.PADDLE_CLIENT_TOKEN,
    required: true
  },
  apiKey: {
    key: 'PADDLE_API_KEY',
    value: env.PADDLE_API_KEY,
    required: true
  },
  environment: {
    key: 'NEXT_PUBLIC_PADDLE_ENVIRONMENT',
    value: env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
    required: false
  },
  webhook: {
    key: 'PADDLE_WEBHOOK_SECRET',
    value: env.PADDLE_WEBHOOK_SECRET,
    required: false
  }
};

let allConfigured = true;
Object.entries(checks).forEach(([name, check]) => {
  const isConfigured = check.value && check.value !== '' && !check.value.includes('CAMBIAR');
  const status = isConfigured ? '✅' : (check.required ? '❌' : '⚠️');
  
  console.log(`${status} ${check.key}`);
  if (isConfigured) {
    // Mostrar preview de la credencial
    const preview = check.value.substring(0, 20) + '...';
    console.log(`   ${preview}`);
  } else {
    console.log(`   NO CONFIGURADO`);
  }
  console.log();
  
  if (!isConfigured && check.required) {
    allConfigured = false;
  }
});

if (!allConfigured) {
  console.log('❌ ERROR: Faltan credenciales requeridas\n');
  console.log('📝 Para configurar Paddle, sigue: GUIA_RAPIDA_PADDLE_SANDBOX.md\n');
  process.exit(1);
}

// Detectar environment
const isLive = env.PADDLE_API_KEY?.includes('live') || env.PADDLE_CLIENT_TOKEN?.includes('live');
const isSandbox = env.PADDLE_API_KEY?.includes('test') || env.PADDLE_CLIENT_TOKEN?.includes('test');
const environment = isLive ? '🔴 LIVE (Producción)' : isSandbox ? '🧪 SANDBOX (Pruebas)' : '❓ Desconocido';

console.log(`🌍 Entorno detectado: ${environment}\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ═══════════════════════════════════════════════════════════
// TEST 2: Probar conexión con Paddle API
// ═══════════════════════════════════════════════════════════
console.log('📡 TEST 2: Conexión con Paddle API\n');

async function testPaddleAPI() {
  try {
    const apiKey = env.PADDLE_API_KEY;
    
    if (!apiKey) {
      console.log('❌ No se puede probar: PADDLE_API_KEY no configurado\n');
      return false;
    }
    
    // Probar listar productos
    const response = await fetch('https://api.paddle.com/products?per_page=5', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexión exitosa con Paddle API\n');
      
      // Mostrar productos
      if (data.data && data.data.length > 0) {
        console.log(`📦 Productos encontrados: ${data.data.length}\n`);
        data.data.forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.name}`);
          console.log(`      ID: ${product.id}`);
          console.log(`      Status: ${product.status}`);
          console.log();
        });
      } else {
        console.log('⚠️  No hay productos creados aún\n');
        console.log('📝 Necesitas crear productos en Paddle:\n');
        if (isLive) {
          console.log('   → https://vendors.paddle.com/products\n');
        } else {
          console.log('   → https://sandbox-vendors.paddle.com/products\n');
        }
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Error al conectar con Paddle API\n');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${errorText.substring(0, 200)}\n`);
      
      if (response.status === 401) {
        console.log('🔑 El API Key parece ser inválido o expirado\n');
        console.log('   Verifica que:\n');
        console.log('   1. El API Key esté copiado correctamente');
        console.log('   2. No tenga espacios extra');
        console.log('   3. Sea del environment correcto (live vs sandbox)\n');
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Error al probar la API:\n');
    console.log(`   ${error.message}\n`);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// TEST 3: Verificar instalación de Paddle.js
// ═══════════════════════════════════════════════════════════
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📦 TEST 3: Paddle.js instalado\n');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const paddleJsVersion = packageJson.dependencies?.['@paddle/paddle-js'];
if (paddleJsVersion) {
  console.log(`✅ @paddle/paddle-js instalado: ${paddleJsVersion}\n`);
} else {
  console.log('❌ @paddle/paddle-js NO instalado\n');
  console.log('   Instalar con: npm install @paddle/paddle-js\n');
}

// Verificar archivos clave
console.log('📁 Archivos de integración:\n');
const keyFiles = [
  { path: 'src/hooks/usePaddle.ts', desc: 'Hook de Paddle' },
  { path: 'src/lib/paddle.ts', desc: 'Configuración de Paddle' },
  { path: 'src/app/api/webhooks/paddle/route.ts', desc: 'Webhook handler' },
];

keyFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file.path));
  console.log(`   ${exists ? '✅' : '❌'} ${file.desc}`);
  console.log(`      ${file.path}\n`);
});

// ═══════════════════════════════════════════════════════════
// EJECUTAR TESTS ASYNC
// ═══════════════════════════════════════════════════════════
async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const apiWorks = await testPaddleAPI();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 RESUMEN FINAL\n');
  
  const results = {
    'Credenciales configuradas': allConfigured,
    'Paddle.js instalado': !!paddleJsVersion,
    'Conexión con API': apiWorks,
    'Archivos de integración': keyFiles.every(f => fs.existsSync(path.join(__dirname, f.path)))
  };
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('🎉 ¡PADDLE ESTÁ FUNCIONANDO CORRECTAMENTE!\n');
    console.log('✅ Próximos pasos:\n');
    console.log('   1. Configurar DKIM (para emails de Retain)');
    console.log('   2. Crear productos y obtener Price IDs');
    console.log('   3. Probar un checkout: npm run dev\n');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisa arriba para más detalles.\n');
    console.log('📚 Guías disponibles:\n');
    console.log('   - GUIA_RAPIDA_PADDLE_SANDBOX.md');
    console.log('   - PADDLE_SETUP_COMPLETADO.md');
    console.log('   - CONFIGURACIONES_EXTRA_PADDLE_RETAIN.md\n');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Ejecutar
runTests().catch(err => {
  console.error('❌ Error ejecutando tests:', err);
  process.exit(1);
});
