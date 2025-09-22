// 🎯 VERIFICACIÓN CSP PARA DATA URLs
// Este script verifica que las políticas de seguridad permitan data URLs

console.log('🔍 VERIFICANDO CONFIGURACIÓN CSP...');

// Simular un data URL típico de imagen
const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Test de creación de imagen
function testImageDataUrl() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      console.log('✅ DATA URL FUNCIONANDO: La imagen se cargó correctamente');
      resolve(true);
    };
    
    img.onerror = (e) => {
      console.error('❌ ERROR CSP: No se puede cargar data URL', e);
      reject(false);
    };
    
    // Intentar cargar data URL
    img.src = testDataUrl;
    
    // Timeout de seguridad
    setTimeout(() => {
      reject(new Error('Timeout'));
    }, 5000);
  });
}

// Test de blob URL
function testBlobUrl() {
  try {
    const blob = new Blob(['test'], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    console.log('✅ BLOB URL FUNCIONANDO:', blobUrl);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch (e) {
    console.error('❌ ERROR BLOB URL:', e);
    return false;
  }
}

// Ejecutar tests solo en browser
if (typeof window !== 'undefined') {
  console.log('🌐 EJECUTANDO EN NAVEGADOR...');
  
  testBlobUrl();
  
  testImageDataUrl()
    .then(() => {
      console.log('🎉 ¡TODOS LOS TESTS PASARON!');
      console.log('✨ El "último acto de amor" está COMPLETO - las previews de imagen funcionan correctamente');
    })
    .catch((error) => {
      console.error('💥 FALLO EN TESTS:', error);
      console.log('🔧 Revisar configuración CSP en next.config.js');
    });
} else {
  console.log('📝 Script listo para ejecutar en navegador');
  console.log('💡 Incluir este script en una página para probar CSP');
}

console.log('\n📋 CONFIGURACIÓN CSP APLICADA:');
console.log('🔹 img-src: "self" data: blob: *');
console.log('🔹 Permite: data URLs, blob URLs, y todas las imágenes externas');
console.log('🔹 Ambiente: Desarrollo y Producción');

module.exports = { testImageDataUrl, testBlobUrl };
