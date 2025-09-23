// 🔒 VERIFICACIÓN CSP PARA VERCEL BLOB STORAGE
console.log('🔍 VERIFICANDO CONFIGURACIÓN CSP PARA VERCEL BLOB...');

// Test URL de Vercel Blob Storage
const testImageUrl = 'https://qsqoercpwiomxvo2.public.blob.vercel-storage.com/test-image.jpg';

console.log('🎯 URL a probar:', testImageUrl);

// Verificar si la URL está permitida por CSP
function testCSP() {
  try {
    // Crear imagen para probar CSP
    const img = new Image();
    
    img.onload = function() {
      console.log('✅ SUCCESS: Imagen de Vercel Blob Storage cargada correctamente');
      console.log('✅ CSP permite *.public.blob.vercel-storage.com');
    };
    
    img.onerror = function(e) {
      console.error('❌ ERROR: No se puede cargar imagen de Vercel Blob Storage', e);
      console.error('🔧 Verificar CSP en next.config.js');
      console.error('🔧 Debe incluir: *.public.blob.vercel-storage.com en img-src');
    };
    
    // Probar carga
    img.src = testImageUrl;
    
    // También probar con un dominio conocido válido
    console.log('🧪 Probando también dominio de prueba válido...');
    const testImg2 = new Image();
    testImg2.onload = () => console.log('✅ Dominio de prueba válido funciona');
    testImg2.onerror = () => console.log('ℹ️ Dominio de prueba no disponible (normal)');
    testImg2.src = 'https://via.placeholder.com/100x100.jpg';
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO en test CSP:', error);
  }
}

// Ejecutar test
testCSP();

console.log('\n📋 CONFIGURACIÓN CSP ESPERADA:');
console.log('🔹 img-src debe incluir: "self" data: blob: *.unsplash.com *.pixabay.com *.public.blob.vercel-storage.com');
console.log('🔹 Para desarrollo: "self" data: blob: *');
console.log('🔹 Para producción: lista específica con Vercel Blob Storage');

console.log('\n💡 Para usar este test:');
console.log('1. Abrir consola del navegador en la página de admin');
console.log('2. Pegar este código');
console.log('3. Verificar que no hay errores de CSP');
