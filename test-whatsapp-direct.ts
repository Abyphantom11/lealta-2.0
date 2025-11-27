/**
 * 📱 SCRIPT DE PRUEBA - ENVIAR MENSAJE A +593987931961
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

console.log('📱 ENVIANDO MENSAJE DE PRUEBA\n');
console.log(`De: ${whatsappNumber}`);
console.log(`Para: whatsapp:+593987931961\n`);

if (!accountSid || !authToken || !whatsappNumber) {
  console.error('❌ ERROR: Faltan variables de Twilio');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function enviarMensaje() {
  try {
    console.log('⏳ Enviando mensaje...\n');
    
    const message = await client.messages.create({
      from: whatsappNumber,
      to: 'whatsapp:+593987931961',
      body: '¡Hola! Este es un mensaje de prueba desde Lealta. ¿Recibiste este mensaje? 🎉'
    });

    console.log('✅ ¡MENSAJE ENVIADO EXITOSAMENTE!\n');
    console.log(`📌 SID del Mensaje: ${message.sid}`);
    console.log(`📌 Estado: ${message.status}`);
    console.log(`📌 De: ${message.from}`);
    console.log(`📌 Para: ${message.to}`);
    console.log(`📌 Mensaje: ${message.body}\n`);
    
    console.log('💡 Verifica tu WhatsApp en +593987931961');
    console.log('💡 El mensaje puede tardar unos segundos en llegar\n');

  } catch (error: any) {
    console.error('❌ ERROR AL ENVIAR:\n');
    console.error(`Error: ${error.message}`);
    console.error(`\nDetalles: ${JSON.stringify(error, null, 2)}`);
    
    if (error.code === 21201) {
      console.error('\n⚠️ El número no está validado en el sandbox de Twilio');
      console.error('Solución: Agrega el número en Twilio Console → Messaging → Try it out');
    } else if (error.code === 21211) {
      console.error('\n⚠️ Número de teléfono inválido');
    } else if (error.code === 20003) {
      console.error('\n⚠️ Credenciales de Twilio incorrectas');
    }
  }
}

enviarMensaje();
