/**
 * 📱 GUÍA COMPLETA: Configuración de WhatsApp Sandbox en Twilio
 * ============================================================
 */

console.log('🔧 CONFIGURACIÓN DE WHATSAPP SANDBOX EN TWILIO');
console.log('===============================================\n');

console.log('📋 PASOS PARA CONFIGURAR WHATSAPP SANDBOX:\n');

console.log('1️⃣ ACCEDE A TWILIO CONSOLE');
console.log('   🌐 Ve a: https://console.twilio.com/');
console.log('   🔑 Inicia sesión con tus credenciales\n');

console.log('2️⃣ NAVEGA A WHATSAPP SANDBOX');
console.log('   📱 Ve a: Develop > Messaging > Try it out > Send a WhatsApp message');
console.log('   🔗 O directamente: https://console.twilio.com/us1/develop/sms/whatsapp/sandbox\n');

console.log('3️⃣ CONFIGURAR TU SANDBOX');
console.log('   📝 Verás una palabra clave única (ej: "join <palabra>")');
console.log('   📱 Envía esa palabra clave al número: +1 (415) 523-8886');
console.log('   ⏳ Espera confirmación de WhatsApp\n');

console.log('4️⃣ VERIFICAR NÚMERO DESTINATARIO');
console.log('   📞 Agrega el número +593987931691 a tu sandbox');
console.log('   💬 El número debe enviar el código de verificación\n');

console.log('5️⃣ CONFIGURAR WEBHOOK (OPCIONAL)');
console.log('   🔗 URL del webhook: https://tu-dominio.com/api/whatsapp/webhook');
console.log('   ⚙️  Método HTTP: POST\n');

console.log('🚨 IMPORTANTE:');
console.log('   • WhatsApp Sandbox es SOLO para pruebas');
console.log('   • Para producción necesitas WhatsApp Business API');
console.log('   • Los números deben estar verificados en el sandbox\n');

console.log('🔄 DESPUÉS DE CONFIGURAR EL SANDBOX:');
console.log('   1. Ejecuta: node verificar-sandbox.js');
console.log('   2. Prueba el envío con: node test-whatsapp-send.js\n');

async function checkSandboxStatus() {
    const twilio = require('twilio');
    require('dotenv').config({ path: '.env.local' });
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
        console.log('❌ Variables de entorno no configuradas');
        return;
    }
    
    try {
        console.log('🔍 VERIFICANDO ESTADO ACTUAL DEL SANDBOX...\n');
        
        const client = twilio(accountSid, authToken);
        
        // Verificar números disponibles de WhatsApp
        const incomingNumbers = await client.incomingPhoneNumbers.list({
            limit: 10
        });
        
        console.log('📞 NÚMEROS DISPONIBLES:');
        incomingNumbers.forEach(number => {
            console.log(`   ${number.phoneNumber} - ${number.friendlyName}`);
        });
        
        console.log('\n📱 SANDBOX INFO:');
        console.log('   Para configurar el sandbox, sigue los pasos de arriba');
        console.log('   El número del sandbox suele ser: +1 (415) 523-8886');
        
    } catch (error) {
        console.log('❌ Error al verificar:', error.message);
        console.log('\n💡 SOLUCIÓN:');
        console.log('   1. Verifica tus credenciales de Twilio');
        console.log('   2. Asegúrate de que tu cuenta esté activa');
        console.log('   3. Configura el sandbox siguiendo los pasos de arriba');
    }
}

// Ejecutar verificación
checkSandboxStatus();
