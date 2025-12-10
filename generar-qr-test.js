/* eslint-disable unicorn/prefer-top-level-await */
/**
 * Script para generar y probar el QR del evento
 */

const QRCode = require('qrcode');
const fs = require('fs');

const qrToken = '81vqVJDmtFrd'; // Token del evento prueba

void (async function() {
  try {
    console.log('🔍 Generando QR con token:', qrToken);
    console.log('📏 Longitud del token:', qrToken.length);
    console.log('🔤 Tipo:', typeof qrToken);
    console.log('\n');
    
    // Generar QR como lo hace EventRegistrationPage
    const qrUrl = await QRCode.toDataURL(qrToken, {
      width: 300,
      margin: 2,
      color: {
        dark: '#6366f1',
        light: '#ffffff'
      }
    });
    
    console.log('✅ QR generado exitosamente');
    console.log('📊 Data URL length:', qrUrl.length);
    console.log('🎨 Formato:', qrUrl.substring(0, 30) + '...');
    
    // Guardar como archivo para inspección visual
    const base64Data = qrUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('test-qr-evento.png', base64Data, 'base64');
    console.log('\n💾 QR guardado en: test-qr-evento.png');
    
    // Generar también un QR en formato texto para terminal
    const terminalQR = await QRCode.toString(qrToken, { type: 'terminal', small: true });
    console.log('\n📱 QR en terminal:');
    console.log(terminalQR);
    
    console.log('\n✅ El QR contiene exactamente:', qrToken);
    console.log('\n💡 Pasos para probar:');
    console.log('   1. Abre test-qr-evento.png');
    console.log('   2. Escanéalo con el scanner de reservas');
    console.log('   3. Debería detectarse como token de evento');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
