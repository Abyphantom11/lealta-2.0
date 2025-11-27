/**
 * 🔧 CONFIGURADOR DE TWILIO
 * Ayuda a configurar las credenciales correctas
 */

console.log('🔧 CONFIGURACIÓN DE TWILIO PARA WHATSAPP');
console.log('==========================================\n');

console.log('📋 PASOS PARA CONFIGURAR:');
console.log('1. Ve a https://console.twilio.com');
console.log('2. Inicia sesión en tu cuenta');
console.log('3. En el dashboard verás:');
console.log('   • Account SID (comienza con "AC")');
console.log('   • Auth Token (haz clic en "Show")');
console.log('');

console.log('📝 ACTUALIZA TU ARCHIVO .env.local CON:');
console.log('');
console.log('TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"');
console.log('TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"');
console.log('TWILIO_WHATSAPP_NUMBER="whatsapp:+18065831846"');
console.log('');

console.log('🧪 CONFIGURACIÓN DE WHATSAPP:');
console.log('');
console.log('OPCIÓN 1: WhatsApp Sandbox (Gratis para testing)');
console.log('• Ve a Develop > Messaging > Try it out > Send a WhatsApp message');
console.log('• Usa el número del sandbox: +1 (415) 523-8886');
console.log('• Los usuarios deben enviar "join <palabra>" para registrarse');
console.log('');

console.log('OPCIÓN 2: Tu número +1 806 583 1846');
console.log('• Necesita estar habilitado para WhatsApp en Twilio');
console.log('• Ve a Phone Numbers > Manage > Active numbers');
console.log('• Configura WhatsApp en tu número +18065831846');
console.log('');

console.log('🚀 DESPUÉS DE CONFIGURAR:');
console.log('1. Reinicia tu servidor: Ctrl+C y luego npm run dev');
console.log('2. Ejecuta: node verify-twilio.js');
console.log('3. Prueba enviar un mensaje desde la interfaz');
console.log('');

console.log('💡 TESTING:');
console.log('Para probar envíos, puedes:');
console.log('• Usar tu propio número de WhatsApp');
console.log('• Configurar el sandbox y enviar "join <palabra>"');
console.log('• Verificar que el número +18065831846 esté habilitado para WhatsApp');
