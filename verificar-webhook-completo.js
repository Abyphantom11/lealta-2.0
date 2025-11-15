/**
 * 🔍 VERIFICAR CONFIGURACIÓN COMPLETA DE WEBHOOK
 * 
 * Este script verifica:
 * 1. ✅ Webhook handler existe en el código
 * 2. ✅ Webhook secret está en .env local
 * 3. ⚠️ Webhook secret debe estar en Vercel (manual)
 * 4. ⚠️ URL del webhook debe estar en Paddle Dashboard (manual)
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO CONFIGURACIÓN DE WEBHOOK PADDLE\n');
console.log('='.repeat(60));

// 1. Verificar que existe el webhook handler
console.log('\n1️⃣ WEBHOOK HANDLER EN CÓDIGO:');
const webhookPath = path.join(__dirname, 'src', 'app', 'api', 'webhooks', 'paddle', 'route.ts');
if (fs.existsSync(webhookPath)) {
  console.log('   ✅ Handler existe en: src/app/api/webhooks/paddle/route.ts');
  console.log('   📍 URL: https://lealta.app/api/webhooks/paddle');
} else {
  console.log('   ❌ Handler NO encontrado');
}

// 2. Verificar .env local
console.log('\n2️⃣ WEBHOOK SECRET EN .env LOCAL:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const secretMatch = envContent.match(/PADDLE_WEBHOOK_SECRET="?([^"\n]+)"?/);
  
  if (secretMatch) {
    const secret = secretMatch[1];
    console.log('   ✅ Secret configurado:');
    console.log(`   🔑 ${secret.substring(0, 20)}...${secret.substring(secret.length - 10)}`);
    
    if (secret.startsWith('ntfset_01k9d9j96f9whgz0qtdke3tb6a')) {
      console.log('   ✅ Es el nuevo secret que mencionaste');
    } else if (secret.startsWith('ntfset_01k9rf9t8ta8tdd06q1vgk2qex')) {
      console.log('   ⚠️ Es un secret DIFERENTE al que mencionaste');
      console.log('   📝 Mencionaste: ntfset_01k9d9j96f9whgz0qtdke3tb6a');
    }
  } else {
    console.log('   ❌ PADDLE_WEBHOOK_SECRET no encontrado en .env');
  }
} else {
  console.log('   ❌ Archivo .env no encontrado');
}

// 3. Instrucciones para Vercel
console.log('\n3️⃣ WEBHOOK SECRET EN VERCEL:');
console.log('   ⚠️ VERIFICA MANUALMENTE:');
console.log('   1. Ve a: https://vercel.com/abyphantom11s-projects/lealta/settings/environment-variables');
console.log('   2. Busca: PADDLE_WEBHOOK_SECRET');
console.log('   3. Debe tener: ntfset_01k9d9j96f9whgz0qtdke3tb6a');
console.log('   4. Si es diferente, actualízalo');

// 4. Instrucciones para Paddle Dashboard
console.log('\n4️⃣ WEBHOOK EN PADDLE DASHBOARD:');
console.log('   ⚠️ VERIFICA MANUALMENTE:');
console.log('   1. Ve a: https://vendors.paddle.com/webhooks');
console.log('   2. Verifica que exista un webhook con:');
console.log('      📍 URL: https://lealta.app/api/webhooks/paddle');
console.log('      🔑 Secret: ntfset_01k9d9j96f9whgz0qtdke3tb6a');
console.log('   3. Eventos recomendados:');
console.log('      ✅ subscription.created');
console.log('      ✅ subscription.updated');
console.log('      ✅ subscription.canceled');
console.log('      ✅ transaction.completed');

// 5. Próximos pasos
console.log('\n5️⃣ PRÓXIMOS PASOS PARA SINCRONIZAR EL PAGO:');
console.log('   A) Si el webhook YA está configurado en Paddle:');
console.log('      → El próximo pago se sincronizará automáticamente');
console.log('      → Puedes disparar manualmente el webhook desde Paddle Dashboard');
console.log('');
console.log('   B) Si el webhook NO está configurado:');
console.log('      1. Configúralo en: https://vendors.paddle.com/webhooks');
console.log('      2. Usa URL: https://lealta.app/api/webhooks/paddle');
console.log('      3. Usa Secret: ntfset_01k9d9j96f9whgz0qtdke3tb6a');
console.log('      4. Selecciona los eventos mencionados arriba');
console.log('');
console.log('   C) Para sincronizar el pago actual ($10 de prueba):');
console.log('      → Puedo crear un script que actualice manualmente la DB');
console.log('      → O puedes disparar el webhook manualmente desde Paddle');

console.log('\n' + '='.repeat(60));
console.log('✅ VERIFICACIÓN COMPLETADA\n');
