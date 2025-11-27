/**
 * 🧪 PRUEBA - ENVIAR SOLO A TI
 */

require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const TEMPLATE_SID = 'HX2e1e6f8cea11d2c18c1761ac48c0ca29';
const TU_NUMERO = '+593987931691'; // Tu número

async function enviarAti() {
  try {
    console.log('📱 ENVIANDO CAMPAÑA SOLO A TI\n');
    console.log(`De: ${whatsappNumber}`);
    console.log(`Para: ${TU_NUMERO}`);
    console.log(`Template: estamos_abiertos\n`);
    console.log('⏳ Enviando...\n');

    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${TU_NUMERO}`,
      contentSid: TEMPLATE_SID
    });

    console.log('✅ ¡MENSAJE ENVIADO EXITOSAMENTE!\n');
    console.log(`📌 SID: ${message.sid}`);
    console.log(`📌 Estado: ${message.status}`);
    console.log(`📌 De: ${message.from}`);
    console.log(`📌 Para: ${message.to}\n`);
    console.log('📱 Verifica tu WhatsApp en +593987931691');
    console.log('💡 El mensaje debería llegar en unos segundos...\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

enviarAti();
