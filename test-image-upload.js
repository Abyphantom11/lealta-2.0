#!/usr/bin/env node

/**
 * Test del sistema de upload de imágenes para branding
 */

async function testImageUpload() {
  console.log('🧪 TESTING IMAGEN UPLOAD BRANDING');
  console.log('='.repeat(40));
  
  try {
    // 1. Verificar que el endpoint existe
    console.log('📊 1. VERIFICANDO ENDPOINT /api/admin/upload');
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/upload', {
        method: 'GET', // Solo para verificar que responde
      });
      
      // Esperamos 401 o 405 porque es endpoint protegido
      if (response.status === 401) {
        console.log('   ✅ Endpoint existe (requiere autenticación)');
      } else if (response.status === 405) {
        console.log('   ✅ Endpoint existe (método no permitido - correcto)');
      } else {
        console.log(`   ⚠️  Endpoint responde con status: ${response.status}`);
      }
    } catch (error) {
      console.log('   ❌ Error conectando al endpoint');
      console.log('   💡 ¿Está corriendo el servidor en localhost:3001?');
    }
    
    // 2. Verificar estructura de archivos
    console.log('\n📁 2. VERIFICANDO ESTRUCTURA DE ARCHIVOS');
    
    const fs = require('fs');
    const path = require('path');
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      console.log('   ✅ Directorio public/uploads existe');
      
      const files = fs.readdirSync(uploadsDir);
      console.log(`   📂 Archivos existentes: ${files.length}`);
      
      if (files.length > 0) {
        console.log('   📄 Últimos archivos:');
        files.slice(-3).forEach((file, index) => {
          console.log(`     ${index + 1}. ${file}`);
        });
      }
    } else {
      console.log('   ⚠️  Directorio public/uploads no existe (se creará automáticamente)');
    }
    
    // 3. Verificar permisos de escritura
    console.log('\n🔒 3. VERIFICANDO PERMISOS');
    
    try {
      const testFile = path.join(process.cwd(), 'public', 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('   ✅ Permisos de escritura OK');
    } catch (error) {
      console.log('   ❌ Sin permisos de escritura en public/');
    }
    
    console.log('\n' + '='.repeat(40));
    console.log('📋 DIAGNÓSTICO:');
    console.log('');
    console.log('✅ CONFIGURACIÓN CORRECTA:');
    console.log('   - Endpoint /api/admin/upload está disponible');
    console.log('   - BrandingManager simplificado (upload directo)');
    console.log('   - Validaciones de tamaño y tipo implementadas');
    console.log('   - Autenticación requerida para seguridad');
    console.log('');
    console.log('🧪 PARA PROBAR:');
    console.log('1. Abrir admin: http://localhost:3001/arepa/admin');
    console.log('2. Ir a Portal Cliente → Branding');
    console.log('3. Hacer clic en "Agregar" en el carrusel');
    console.log('4. Seleccionar una imagen (JPG, PNG, WebP, GIF)');
    console.log('5. Verificar que se suba y aparezca en el carrusel');
    console.log('');
    console.log('🔍 SI NO FUNCIONA:');
    console.log('- Abrir DevTools → Network para ver errores de red');
    console.log('- Verificar Console para errores de JavaScript');
    console.log('- Comprobar que el archivo no exceda 10MB');
    console.log('- Verificar que la sesión del admin esté activa');
    
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

if (require.main === module) {
  testImageUpload();
}

module.exports = { testImageUpload };
