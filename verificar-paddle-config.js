/**
 * 🔍 VERIFICAR CONFIGURACIÓN DE PADDLE
 * 
 * Este script verifica que todas las variables de Paddle
 * estén correctamente configuradas en tu entorno.
 */

console.log('\n🔍 VERIFICANDO CONFIGURACIÓN DE PADDLE\n');
console.log('='.repeat(60));

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const requiredVars = {
  // Backend (privadas)
  'PADDLE_VENDOR_ID': {
    value: process.env.PADDLE_VENDOR_ID,
    required: true,
    description: 'ID de tu cuenta de Paddle',
    example: '257347'
  },
  'PADDLE_API_KEY': {
    value: process.env.PADDLE_API_KEY,
    required: true,
    description: 'API Key para el backend',
    example: 'pdl_sdbx_apikey_...'
  },
  'PADDLE_CLIENT_TOKEN': {
    value: process.env.PADDLE_CLIENT_TOKEN,
    required: true,
    description: 'Client Token para API routes',
    example: 'test_...'
  },
  'PADDLE_WEBHOOK_SECRET': {
    value: process.env.PADDLE_WEBHOOK_SECRET,
    required: true,
    description: 'Secret para verificar webhooks',
    example: 'ntfset_01...'
  },
  
  // Frontend (públicas)
  'NEXT_PUBLIC_PADDLE_ENVIRONMENT': {
    value: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
    required: true,
    description: 'Entorno de Paddle',
    example: 'sandbox'
  },
  'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN': {
    value: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    required: true,
    description: 'Client Token para Paddle.js',
    example: 'test_...'
  },
  'NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID': {
    value: process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID,
    required: true,
    description: 'Price ID del plan Enterprise',
    example: 'pri_01...'
  },
  
  // Opcionales pero recomendadas
  'PADDLE_PLAN_ENTERPRISE_ID': {
    value: process.env.PADDLE_PLAN_ENTERPRISE_ID,
    required: false,
    description: 'Price ID (backend)',
    example: 'pri_01...'
  },
  'NEXT_PUBLIC_PADDLE_PRODUCT_ID': {
    value: process.env.NEXT_PUBLIC_PADDLE_PRODUCT_ID,
    required: false,
    description: 'Product ID',
    example: 'pro_01...'
  }
};

let allGood = true;
let errors = [];
let warnings = [];

console.log('\n📋 VARIABLES REQUERIDAS:\n');

Object.entries(requiredVars).forEach(([key, config]) => {
  const isConfigured = config.value && config.value.trim() !== '' && !config.value.includes('CAMBIAR');
  const status = isConfigured ? '✅' : (config.required ? '❌' : '⚠️');
  
  console.log(`${status} ${key}`);
  console.log(`   Descripción: ${config.description}`);
  
  if (isConfigured) {
    // Ocultar parte del valor por seguridad
    const displayValue = config.value.length > 15 
      ? config.value.substring(0, 15) + '...'
      : config.value;
    console.log(`   Valor: ${displayValue}`);
  } else {
    console.log(`   ⚠️ NO CONFIGURADA`);
    console.log(`   Ejemplo: ${config.example}`);
    
    if (config.required) {
      errors.push(`${key} es requerida pero no está configurada`);
      allGood = false;
    } else {
      warnings.push(`${key} no está configurada (opcional)`);
    }
  }
  console.log('');
});

// Validaciones adicionales
console.log('='.repeat(60));
console.log('\n🔍 VALIDACIONES ADICIONALES:\n');

// 1. Verificar que el ambiente coincida
const backendToken = process.env.PADDLE_CLIENT_TOKEN || '';
const frontendToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || '';

if (backendToken && frontendToken && backendToken !== frontendToken) {
  console.log('❌ Los tokens de backend y frontend NO coinciden');
  errors.push('PADDLE_CLIENT_TOKEN y NEXT_PUBLIC_PADDLE_CLIENT_TOKEN deben ser iguales');
  allGood = false;
} else if (backendToken && frontendToken) {
  console.log('✅ Los tokens de backend y frontend coinciden');
}

// 2. Verificar que el token coincida con el ambiente
if (environment === 'sandbox' && backendToken && !backendToken.startsWith('test_')) {
  console.log('⚠️ Estás en modo sandbox pero el token NO empieza con "test_"');
  warnings.push('El token debería empezar con "test_" en sandbox');
}

if (environment === 'production' && backendToken && !backendToken.startsWith('live_')) {
  console.log('⚠️ Estás en modo production pero el token NO empieza con "live_"');
  warnings.push('El token debería empezar con "live_" en production');
}

// 3. Verificar Vendor ID
const vendorId = process.env.PADDLE_VENDOR_ID || '';
if (vendorId && vendorId === 'your-paddle-vendor-id') {
  console.log('❌ PADDLE_VENDOR_ID tiene el valor de placeholder');
  errors.push('Debes cambiar PADDLE_VENDOR_ID por tu ID real (257347)');
  allGood = false;
} else if (vendorId) {
  console.log(`✅ PADDLE_VENDOR_ID configurado: ${vendorId}`);
}

// Resumen
console.log('\n' + '='.repeat(60));
console.log('\n📊 RESUMEN:\n');

if (errors.length > 0) {
  console.log('❌ ERRORES ENCONTRADOS:\n');
  errors.forEach(err => console.log(`   • ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️ ADVERTENCIAS:\n');
  warnings.forEach(warn => console.log(`   • ${warn}`));
  console.log('');
}

if (allGood && warnings.length === 0) {
  console.log('✅ ¡TODO CONFIGURADO CORRECTAMENTE!\n');
  console.log('🚀 Puedes proceder a:');
  console.log('   1. Iniciar tu servidor: npm run dev');
  console.log('   2. Probar Paddle en: http://localhost:3001/pricing');
  console.log('   3. Configurar las mismas variables en Vercel');
  console.log('');
} else if (allGood && warnings.length > 0) {
  console.log('✅ CONFIGURACIÓN MÍNIMA COMPLETA\n');
  console.log('⚠️ Hay advertencias pero puedes continuar');
  console.log('');
} else {
  console.log('❌ CONFIGURACIÓN INCOMPLETA\n');
  console.log('📝 Sigue estos pasos:');
  console.log('   1. Ve a: https://sandbox-vendors.paddle.com');
  console.log('   2. Obtén tus credenciales de sandbox');
  console.log('   3. Actualiza tu archivo .env.local');
  console.log('   4. Lee: CONFIGURAR_PADDLE_VERCEL.md');
  console.log('');
}

console.log('='.repeat(60));
console.log('');

// Exit con código apropiado
process.exit(allGood ? 0 : 1);
