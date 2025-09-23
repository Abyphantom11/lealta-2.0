import { put } from '@vercel/blob';

async function testVercelBlob() {
  console.log('🧪 TESTING: Vercel Blob Upload');
  console.log('================================\n');

  // Verificar variables de entorno
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  console.log('BLOB_READ_WRITE_TOKEN:', token ? 'SET' : 'NOT SET');
  
  if (!token) {
    console.log('❌ ERROR: BLOB_READ_WRITE_TOKEN no está configurado');
    console.log('Por favor, configura la variable de entorno y vuelve a intentar');
    return;
  }

  try {
    // Crear un archivo de prueba simple
    const testData = Buffer.from('Prueba de upload a Vercel Blob - ' + new Date().toISOString());
    const filename = `test/upload-test-${Date.now()}.txt`;
    
    console.log('📤 Subiendo archivo de prueba...');
    console.log('Filename:', filename);
    console.log('Size:', testData.length, 'bytes');
    
    const result = await put(filename, testData, {
      access: 'public',
      token: token,
    });
    
    console.log('✅ ÉXITO: Archivo subido correctamente');
    console.log('URL:', result.url);
    console.log('Pathname:', result.pathname);
    
    // Probar descarga
    console.log('\n📥 Probando descarga...');
    const response = await fetch(result.url);
    
    if (response.ok) {
      const downloadedData = await response.text();
      console.log('✅ ÉXITO: Archivo descargado correctamente');
      console.log('Content:', downloadedData.substring(0, 50) + '...');
    } else {
      console.log('❌ ERROR: No se pudo descargar el archivo');
      console.log('Status:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    
    if (error.message.includes('This store does not exist')) {
      console.log('\n🔧 SOLUCIÓN:');
      console.log('1. Ve a https://vercel.com/dashboard');
      console.log('2. Selecciona tu proyecto "lealta"');
      console.log('3. Ve a Settings > Storage');
      console.log('4. Conecta el Blob Store al proyecto');
      console.log('5. Copia el nuevo token y actualiza la variable de entorno');
    }
  }
}

testVercelBlob().catch(console.error);
