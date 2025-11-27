/**
 * 🔍 SCRIPT DE DIAGNÓSTICO PARA ENVÍO DE WHATSAPP
 * Ayuda a identificar problemas con Twilio
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

console.log('🔍 DIAGNÓSTICO DE CONFIGURACIÓN TWILIO\n');

// 1. Verificar variables de entorno
console.log('1️⃣ VARIABLES DE ENTORNO:');
console.log(`   ✓ TWILIO_ACCOUNT_SID: ${accountSid ? '✅ Configurado' : '❌ Faltante'}`);
console.log(`   ✓ TWILIO_AUTH_TOKEN: ${authToken ? '✅ Configurado' : '❌ Faltante'}`);
console.log(`   ✓ TWILIO_WHATSAPP_NUMBER: ${whatsappNumber ? `✅ ${whatsappNumber}` : '❌ Faltante (usando sandbox)'}\n`);

if (!accountSid || !authToken) {
  console.error('❌ FATAL: Faltan credenciales de Twilio');
  process.exit(1);
}

// 2. Verificar conexión con Twilio
console.log('2️⃣ VERIFICANDO CONEXIÓN CON TWILIO:');
const client = twilio(accountSid, authToken);

async function diagnostico() {
  try {
    // Obtener información de la cuenta
    const account = await client.api.accounts(accountSid!).fetch();
    console.log(`   ✅ Conexión establecida con cuenta: ${account.friendlyName}`);
    console.log(`   ✅ Estado: ${account.status}`);
    console.log(`   ✅ Tipo: ${account.type}\n`);

    // 3. Verificar números disponibles
    console.log('3️⃣ NÚMEROS DISPONIBLES:');
    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list();
    
    if (incomingPhoneNumbers.length === 0) {
      console.log('   ⚠️ No hay números telefónicos configurados');
    } else {
      incomingPhoneNumbers.forEach((number: any) => {
        console.log(`   ✅ ${number.phoneNumber} - ${number.friendlyName}`);
      });
    }
    console.log();

    // 4. Verificar sandbox de WhatsApp
    console.log('4️⃣ SANDBOX DE WHATSAPP:');
    const services = await client.messaging.services.list();
    
    let sandboxFound = false;
    for (const service of services) {
      const details = await client.messaging.services(service.sid).fetch();
      console.log(`   📦 Servicio: ${details.friendlyName}`);
      console.log(`   - SID: ${details.sid}`);
      console.log(`   - URL Webhook: ${details.inboundRequestUrl || 'No configurada'}`);
      
      if (service.friendlyName?.includes('WhatsApp') || service.friendlyName?.includes('whatsapp')) {
        sandboxFound = true;
      }
    }
    
    if (!sandboxFound) {
      console.log('   ⚠️ No se encontró servicio de WhatsApp\n');
    } else {
      console.log('   ✅ Servicio WhatsApp encontrado\n');
    }

    // 5. Verificar mensajes recientes
    console.log('5️⃣ ÚLTIMOS MENSAJES ENVIADOS:');
    const messages = await client.messages.list({ limit: 5 });
    
    if (messages.length === 0) {
      console.log('   ℹ️ No hay mensajes registrados\n');
    } else {
      messages.forEach((msg: any, index: number) => {
        console.log(`   ${index + 1}. De: ${msg.from} → A: ${msg.to}`);
        console.log(`      Estado: ${msg.status}`);
        console.log(`      Fecha: ${msg.dateCreated}`);
        console.log(`      SID: ${msg.sid}\n`);
      });
    }

    // 6. Recomendaciones
    console.log('6️⃣ RECOMENDACIONES:');
    console.log('   ✓ Usar sandbox de Twilio WhatsApp para pruebas');
    console.log('   ✓ Número debe estar en formato internacional (+595...)');
    console.log('   ✓ El remitente debe ser el número configurado en Twilio');
    console.log('   ✓ Para producción, necesitas aprobar tu plantilla en Twilio\n');

  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('\nProblemas comunes:');
    console.error('- Credenciales incorrectas');
    console.error('- Cuenta de Twilio suspendida');
    console.error('- API keys vencidas\n');
  }
}

diagnostico();
