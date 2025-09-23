import { put } from '@vercel/blob';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

async function testBothTokens() {
  console.log('🧪 TESTING: Vercel Blob Upload - Ambos Tokens');
  console.log('============================================\n');

  const tokens = {
    'BLOB_READ_WRITE_TOKEN': process.env.BLOB_READ_WRITE_TOKEN,
    'LEALTA_READ_WRITE_TOKEN': process.env.LEALTA_READ_WRITE_TOKEN
  };

  for (const [tokenName, tokenValue] of Object.entries(tokens)) {
    console.log(`🔑 Probando token: ${tokenName}`);
    console.log(`Token disponible: ${tokenValue ? 'SÍ' : 'NO'}`);
    
    if (!tokenValue) {
      console.log('❌ Token no disponible\n');
      continue;
    }

    try {
      // Crear un archivo de prueba simple
      const testData = Buffer.from(`Prueba con ${tokenName} - ${new Date().toISOString()}`);
      const filename = `test/${tokenName.toLowerCase()}-test-${Date.now()}.txt`;
      
      console.log('📤 Subiendo archivo de prueba...');
      console.log('Filename:', filename);
      console.log('Size:', testData.length, 'bytes');
      
      const result = await put(filename, testData, {
        access: 'public',
        token: tokenValue,
      });
      
      console.log('✅ ÉXITO: Archivo subido correctamente');
      console.log('URL:', result.url);
      console.log('Pathname:', result.pathname);
      
      // Probar descarga
      console.log('📥 Probando descarga...');
      const response = await fetch(result.url);
      
      if (response.ok) {
        const downloadedData = await response.text();
        console.log('✅ ÉXITO: Archivo descargado correctamente');
        console.log('Content:', downloadedData.substring(0, 50) + '...');
        console.log(`\n🎉 TOKEN FUNCIONANDO: ${tokenName}\n`);
        return { tokenName, tokenValue };
      } else {
        console.log('❌ ERROR: No se pudo descargar el archivo');
        console.log('Status:', response.status, response.statusText);
      }
      
    } catch (error) {
      console.log(`❌ ERROR con ${tokenName}:`, error.message);
    }
    
    console.log('='.repeat(50) + '\n');
  }
  
  console.log('❌ NINGÚN TOKEN FUNCIONÓ');
  console.log('\n🔧 Necesitamos revisar la configuración del Blob Store en Vercel');
  return null;
}

testBothTokens().catch(console.error);
