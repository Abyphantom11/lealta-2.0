// Script para verificar que las credenciales de Paddle están configuradas
console.log('🔍 VERIFICANDO CREDENCIALES DE PADDLE...\n');

const credentials = {
  'PADDLE_API_KEY': process.env.PADDLE_API_KEY,
  'PADDLE_CLIENT_TOKEN': process.env.PADDLE_CLIENT_TOKEN,
  'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN': process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
  'PADDLE_WEBHOOK_SECRET': process.env.PADDLE_WEBHOOK_SECRET,
  'NEXT_PUBLIC_PADDLE_ENVIRONMENT': process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
  'PADDLE_PLAN_ENTERPRISE_ID': process.env.PADDLE_PLAN_ENTERPRISE_ID,
  'NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID': process.env.NEXT_PUBLIC_PADDLE_PLAN_ENTERPRISE_ID,
};

let allGood = true;

Object.entries(credentials).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const maskedValue = value ? `${value.substring(0, 15)}...` : 'NO CONFIGURADO';
  console.log(`${status} ${key}: ${maskedValue}`);
  
  if (!value) {
    allGood = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allGood) {
  console.log('✅ TODAS LAS CREDENCIALES DE PADDLE ESTÁN CONFIGURADAS');
  console.log('🚀 Puedes proceder a probar el checkout en /pricing');
} else {
  console.log('❌ FALTAN CREDENCIALES');
  console.log('⚠️ Verifica tu archivo .env.local');
}

console.log('='.repeat(60) + '\n');
