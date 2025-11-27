/**
 * 📱 ENVIAR MENSAJE DE CAMPAÑA A TU NÚMERO CON TEMPLATE
 */

require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// ⚠️ REEMPLAZA ESTO CON TU TEMPLATE SID
const TEMPLATE_SID = 'HX2e1e6f8cea11d2c18c1761ac48c0ca29'; // Template: estamos_abiertos
const TU_NUMERO = '+593987931691'; // TU NÚMERO

const client = twilio(accountSid, authToken);

async function enviarAtuNumero() {
  try {
    console.log('📱 ENVIANDO CAMPAÑA A TU NÚMERO CON TEMPLATE\n');
    console.log(`De: ${whatsappNumber}`);
    console.log(`Para: ${TU_NUMERO}`);
    console.log(`Template SID: ${TEMPLATE_SID}\n`);
    console.log('⏳ Enviando...\n');

    const message = await client.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${TU_NUMERO}`,
      contentSid: TEMPLATE_SID
    });

    console.log('✅ ¡CAMPAÑA ENVIADA EXITOSAMENTE!\n');
    console.log(`📌 SID del Mensaje: ${message.sid}`);
    console.log(`📌 Estado: ${message.status}`);
    console.log(`📌 De: ${message.from}`);
    console.log(`📌 Para: ${message.to}\n`);
    
    console.log('💡 Revisa tu WhatsApp en unos segundos...\n');

  } catch (error) {
    console.error('❌ ERROR AL ENVIAR:\n');
    console.error(`Error: ${error.message}`);
    console.error(`\nDetalles:`);
    console.error(JSON.stringify({
      code: error.code,
      message: error.message,
      status: error.status,
    }, null, 2));
  }
}

enviarAtuNumero();
