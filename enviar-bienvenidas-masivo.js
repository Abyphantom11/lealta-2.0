/**
 * 🎉 ENVÍO MASIVO DE BIENVENIDAS - Love Me Sky
 * ===========================================
 */

const twilio = require('twilio');
require('dotenv').config({ path: '.env.local' });

async function enviarBienvenidaMasiva() {
    console.log('🎉 INICIANDO CAMPAÑA DE BIENVENIDA');
    console.log('==================================\n');
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = 'whatsapp:+593995683452'; // Tu nuevo número
    
    if (!accountSid || !authToken) {
        console.log('❌ Configura las variables de entorno');
        return;
    }
    
    const client = twilio(accountSid, authToken);
    
    // Mensaje de bienvenida para Love Me Sky
    const mensajeBienvenida = `🎉 ¡Bienvenido a Love Me Sky!

Hola, somos el equipo de Love Me Sky y queremos darte la bienvenida a nuestro programa de fidelización.

✨ TUS BENEFICIOS EXCLUSIVOS:
🎁 Acumula puntos con cada visita
💰 Descuentos especiales para miembros  
🔥 Promociones exclusivas
⭐ Atención prioritaria
🎂 Sorpresa especial en tu cumpleaños

📱 Este es nuestro número oficial de WhatsApp: +593 99 568 3452
¡Guárdalo para estar al día con nuestras ofertas!

🕐 Horarios de atención:
Lunes a Domingo: 8:00 AM - 10:00 PM

¡Esperamos verte pronto! 🍽️✨

El equipo de Love Me Sky 💙`;

    // Para empezar, enviar solo a tu número de prueba
    const numerosDestino = [
        '+593987931691' // Tu número de prueba - luego agregarás los 114 clientes
    ];
    
    let exitosos = 0;
    let errores = 0;
    
    console.log(`📤 Enviando a ${numerosDestino.length} destinatarios...`);
    console.log(`📱 Desde: ${whatsappNumber}`);
    console.log('');
    
    for (const numero of numerosDestino) {
        try {
            const message = await client.messages.create({
                from: whatsappNumber,
                to: `whatsapp:${numero}`,
                body: mensajeBienvenida
            });
            
            console.log(`✅ ${numero}: ${message.sid} - ${message.status}`);
            exitosos++;
            
            // Pausa entre mensajes para evitar spam
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`❌ Error ${numero}: ${error.message}`);
            errores++;
        }
    }
    
    console.log('\n📊 RESUMEN FINAL:');
    console.log('=================');
    console.log(`✅ Mensajes exitosos: ${exitosos}`);
    console.log(`❌ Mensajes con error: ${errores}`);
    console.log(`📱 Total enviados: ${exitosos + errores}`);
    
    if (exitosos > 0) {
        console.log('\n🎉 ¡CAMPAÑA DE BIENVENIDA INICIADA!');
        console.log('🔔 Revisa WhatsApp para confirmar');
        
        console.log('\n🚀 PRÓXIMOS PASOS:');
        console.log('1. Una vez confirmado, agrega los 114 números de clientes');
        console.log('2. Ejecuta nuevamente este script');
        console.log('3. ¡Todos tus clientes recibirán la bienvenida!');
    }
}

// Función para agregar todos los números de la base de datos
async function prepararListaCompleta() {
    console.log('\n📋 PREPARANDO LISTA COMPLETA DE CLIENTES...');
    console.log('============================================');
    
    // Aquí conectarías con tu base de datos para obtener los 114 números
    // Por ahora, simulamos algunos números para el ejemplo
    
    const clientesExample = [
        { nombre: 'María García', telefono: '+593987931691' },
        { nombre: 'Juan Pérez', telefono: '+593998123456' },
        { nombre: 'Ana López', telefono: '+593987654321' }
        // ... aquí irían los 114 números reales
    ];
    
    console.log('📊 Clientes en la base de datos:', clientesExample.length);
    console.log('📱 Números listos para campaña de bienvenida');
    
    return clientesExample;
}

// Ejecutar
console.log('🚀 SISTEMA DE BIENVENIDA LOVE ME SKY');
console.log('===================================');
console.log('📞 Número configurado: +593995683452');
console.log('🎯 Listo para enviar bienvenidas');
console.log('');

enviarBienvenidaMasiva();
