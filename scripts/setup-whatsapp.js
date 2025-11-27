/**
 * 📱 SCRIPT DE CONFIGURACIÓN WHATSAPP
 * Ayuda a configurar el servicio de WhatsApp con Twilio
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 CONFIGURACIÓN DE WHATSAPP CON TWILIO\n');
  console.log('Este script te ayudará a configurar WhatsApp en tu aplicación.\n');

  // Verificar si ya está configurado
  const envPath = path.join(process.cwd(), '.env.local');
  let currentEnv = '';
  
  if (fs.existsSync(envPath)) {
    currentEnv = fs.readFileSync(envPath, 'utf8');
  }

  console.log('📋 PASOS PARA CONFIGURAR TWILIO WHATSAPP:\n');
  console.log('1. Crear cuenta en Twilio (https://www.twilio.com)');
  console.log('2. Ir a Console > Messaging > Try WhatsApp');
  console.log('3. Copiar Account SID, Auth Token y WhatsApp Number\n');

  const needsSetup = await question('¿Necesitas configurar las credenciales de Twilio? (y/N): ');

  if (needsSetup.toLowerCase() === 'y') {
    console.log('\n📝 Ingresa tus credenciales de Twilio:');
    
    const accountSid = await question('Account SID: ');
    const authToken = await question('Auth Token: ');
    const whatsappNumber = await question('WhatsApp Number (ej: whatsapp:+14155238886): ');

    // Agregar/actualizar variables en .env.local
    const newVars = [
      `TWILIO_ACCOUNT_SID="${accountSid}"`,
      `TWILIO_AUTH_TOKEN="${authToken}"`,
      `TWILIO_WHATSAPP_NUMBER="${whatsappNumber}"`
    ];

    let updatedEnv = currentEnv;
    
    for (const newVar of newVars) {
      const [key] = newVar.split('=');
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (updatedEnv.includes(key)) {
        updatedEnv = updatedEnv.replace(regex, newVar);
      } else {
        updatedEnv += '\n' + newVar;
      }
    }

    fs.writeFileSync(envPath, updatedEnv);
    console.log('✅ Variables de entorno actualizadas en .env.local');
  }

  console.log('\n🧪 TESTING DE LA CONFIGURACIÓN:');
  
  const testNumber = await question('Número de prueba (ej: +593987654321): ');
  
  if (testNumber) {
    console.log('\n📤 Probando envío de mensaje...');
    
    try {
      // Simular test (en desarrollo real usarías la API)
      console.log('✅ Test simulado exitoso!');
      console.log('📱 En producción, el mensaje se enviaría a:', testNumber);
      console.log('\n💡 PRÓXIMOS PASOS:');
      console.log('1. Verificar tu número en Twilio Sandbox');
      console.log('2. Probar desde el panel de WhatsApp en tu dashboard');
      console.log('3. Para producción, solicitar aprobación de Meta para tu número');
    } catch (error) {
      console.log('❌ Error en test:', error.message);
    }
  }

  console.log('\n📚 DOCUMENTACIÓN ÚTIL:');
  console.log('- Twilio WhatsApp API: https://www.twilio.com/docs/whatsapp/api');
  console.log('- Configurar Webhook: https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox');
  console.log('- Tu webhook URL: ' + (process.env.NEXT_PUBLIC_APP_URL || 'TU_DOMINIO') + '/api/webhooks/whatsapp');

  console.log('\n🎯 CONFIGURACIÓN WEBHOOK (IMPORTANTE):');
  console.log('1. Ve a Twilio Console > Messaging > Settings > WhatsApp Sandbox');
  console.log('2. Configura tu webhook URL para recibir estados de mensajes');
  console.log('3. URL del webhook:', (process.env.NEXT_PUBLIC_APP_URL || 'TU_DOMINIO') + '/api/webhooks/whatsapp');

  rl.close();
}

main().catch(console.error);
