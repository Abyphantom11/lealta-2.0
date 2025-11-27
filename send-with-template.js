/**
 * 🔍 OBTENER TEMPLATES Y CREAR ENVÍO CON TEMPLATE
 */

require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

async function enviarConTemplate() {
  try {
    console.log('📋 BUSCANDO TEMPLATES...\n');

    // Obtener la lista de WhatsApp Business Accounts
    const accounts = await client.messaging.whatsappBusinessAccounts.list();
    
    if (accounts.length === 0) {
      console.log('❌ No hay WhatsApp Business Accounts configuradas');
      return;
    }

    console.log(`✅ Encontradas ${accounts.length} cuentas de WhatsApp\n`);

    for (const account of accounts) {
      console.log(`Cuenta: ${account.friendlyName}`);
      console.log(`SID: ${account.sid}\n`);

      // Obtener templates de esta cuenta
      try {
        const templates = await client.messaging.whatsappBusinessAccounts(account.sid).messageTemplates.list();
        
        if (templates.length > 0) {
          console.log(`📋 Templates disponibles (${templates.length}):\n`);
          
          templates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name}`);
            console.log(`   SID: ${template.sid}`);
            console.log(`   Estado: ${template.status}`);
            console.log(`   Lenguaje: ${template.language}\n`);
          });

          // Intentar enviar con el primer template
          if (templates.length > 0) {
            console.log('⏳ Intentando enviar mensaje con template...\n');
            
            try {
              const message = await client.messages.create({
                from: whatsappNumber,
                to: 'whatsapp:+593987931691',
                contentSid: templates[0].sid  // Usar el SID del primer template
              });

              console.log('✅ ¡MENSAJE ENVIADO CON TEMPLATE!\n');
              console.log(`SID: ${message.sid}`);
              console.log(`Estado: ${message.status}`);
              console.log(`Template usado: ${templates[0].name}\n`);

            } catch (sendError) {
              console.error('❌ Error al enviar con template:', sendError.message);
              console.log('Detalles:', sendError);
            }
          }
        } else {
          console.log('❌ No hay templates en esta cuenta\n');
        }
      } catch (templateError) {
        console.log('⚠️ No se pudieron listar templates:', templateError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
  }
}

enviarConTemplate();
