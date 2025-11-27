/**
 * 📋 GESTIÓN DE TEMPLATES DE WHATSAPP
 */

require('dotenv').config({ path: '.env.local' });
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);

async function listarTemplates() {
  try {
    console.log('📋 LISTANDO TEMPLATES DE WHATSAPP\n');
    
    // Obtener WhatsApp Business Account ID
    const senders = await client.messaging.services.list();
    
    let whatsappServiceSid = null;
    for (const service of senders) {
      const details = await client.messaging.services(service.sid).fetch();
      if (details.friendlyName.includes('WhatsApp')) {
        whatsappServiceSid = service.sid;
        break;
      }
    }

    if (!whatsappServiceSid) {
      console.log('❌ No se encontró servicio de WhatsApp');
      return;
    }

    // Listar templates
    const templates = await client.messaging.v1.services(whatsappServiceSid).templates.list();
    
    if (templates.length === 0) {
      console.log('❌ No hay templates creados\n');
      console.log('📝 PASOS PARA CREAR UN TEMPLATE:\n');
      console.log('1. Ve a Twilio Console → Messaging → Content Template Builder');
      console.log('2. Haz clic en "Create template"');
      console.log('3. Configura:');
      console.log('   - Nombre: test_mensaje');
      console.log('   - Categoría: TRANSACTIONAL');
      console.log('   - Idioma: Spanish');
      console.log('   - Body: "Hola! Este es un mensaje de prueba desde Lealta"');
      console.log('4. Haz clic en "Create"');
      console.log('5. Espera a que sea aprobado (puede tardar minutos)\n');
      return;
    }

    console.log(`✅ Se encontraron ${templates.length} template(s):\n`);
    templates.forEach((template, index) => {
      console.log(`${index + 1}. Nombre: ${template.friendlyName}`);
      console.log(`   SID: ${template.sid}`);
      console.log(`   Estado: ${template.status}`);
      console.log(`   Lenguaje: ${template.language}`);
      console.log(`   Creado: ${template.dateCreated}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listarTemplates();
