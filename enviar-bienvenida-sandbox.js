/**
 * 🎉 BIENVENIDAS CON SANDBOX - Mientras se activa el número personalizado
 */

const twilio = require('twilio');
require('dotenv').config({ path: '.env.local' });

async function enviarBienvenidaConSandbox() {
    console.log('🎉 CAMPAÑA DE BIENVENIDA (SANDBOX TEMPORAL)');
    console.log('==========================================\n');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const sandboxNumber = 'whatsapp:+14155238886'; // Sandbox que funciona
    
    const client = twilio(accountSid, authToken);
    
    // Mensaje que menciona el futuro número personalizado
    const mensajeBienvenida = `🎉 ¡Bienvenido a Love Me Sky!

Hola, somos el equipo de Love Me Sky y queremos darte la bienvenida a nuestro programa de fidelización.

✨ TUS BENEFICIOS EXCLUSIVOS:
🎁 Acumula puntos con cada visita
💰 Descuentos especiales para miembros  
🔥 Promociones exclusivas
⭐ Atención prioritaria
🎂 Sorpresa especial en tu cumpleaños

📱 PRÓXIMAMENTE: Nuevo número oficial WhatsApp +593 99 568 3452
(Por ahora recibes este mensaje desde nuestro sistema)

🕐 Horarios de atención:
Lunes a Domingo: 8:00 AM - 10:00 PM

¡Esperamos verte pronto! 🍽️✨

El equipo de Love Me Sky 💙`;

    try {
        console.log('📤 ENVIANDO MENSAJE DE BIENVENIDA...');
        console.log(`📱 Desde: ${sandboxNumber} (sandbox temporal)`);
        console.log(`📞 Hacia: whatsapp:+593987931691`);
        console.log('');
        
        const message = await client.messages.create({
            from: sandboxNumber,
            to: 'whatsapp:+593987931691',
            body: mensajeBienvenida
        });
        
        console.log('✅ ¡MENSAJE DE BIENVENIDA ENVIADO!');
        console.log('==================================');
        console.log(`📋 SID: ${message.sid}`);
        console.log(`📊 Estado: ${message.status}`);
        console.log('');
        console.log('🔔 Revisa tu WhatsApp para confirmar');
        console.log('');
        console.log('💡 NOTA: Una vez que tengas el número +593995683452 activo,');
        console.log('   podrás usar ese número en lugar del sandbox.');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

enviarBienvenidaConSandbox();
