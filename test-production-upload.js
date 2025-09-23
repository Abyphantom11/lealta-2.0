// 🧪 Test específico para /api/admin/upload en producción
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testProductionUpload() {
  console.log('🚀 TESTING: /api/admin/upload en Producción');
  console.log('============================================\n');

  const urls = {
    'Producción Actual': 'https://lealta-lsyakzmw7-themaster2648-9501s-projects.vercel.app',
    'Localhost (tunnel)': 'http://localhost:3001'
  };

  // Crear imagen de prueba
  const testImageBuffer = Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 
    0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 144, 119, 83, 222
  ]);
  
  for (const [name, baseUrl] of Object.entries(urls)) {
    console.log(`\n📡 PROBANDO: ${name}`);
    console.log(`URL: ${baseUrl}/api/admin/upload`);
    console.log('='.repeat(50));
    
    try {
      const formData = new FormData();
      formData.append('file', testImageBuffer, {
        filename: 'test-upload.png',
        contentType: 'image/png'
      });
      
      const response = await fetch(`${baseUrl}/api/admin/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders(),
        }
      });

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ ÉXITO:', result);
      } else {
        const errorText = await response.text();
        console.log('❌ ERROR:', errorText);
        
        // Diagnóstico específico
        if (response.status === 500) {
          console.log('\n🔧 DIAGNÓSTICO:');
          console.log('- Error 500 indica problema en el servidor');
          console.log('- Probable causa: BLOB_READ_WRITE_TOKEN incorrecto');
          console.log('- Revisar variables de entorno en Vercel');
        }
      }
      
    } catch (error) {
      console.log('❌ FETCH ERROR:', error.message);
    }
  }

  console.log('\n📋 PASOS PARA VERIFICAR EN VERCEL:');
  console.log('==================================');
  console.log('1. Ir a https://vercel.com/themaster2648-9501s-projects/lealta');
  console.log('2. Settings > Environment Variables');
  console.log('3. Verificar BLOB_READ_WRITE_TOKEN');
  console.log('4. Valor correcto: vercel_blob_rw_QSQoErcPWIoMxvo2_DYdNIDEA6Q1yeI3T0BHuwbTnC0grwT');
}

testProductionUpload().catch(console.error);
