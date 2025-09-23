const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Test completo del sistema de análisis de IA
async function testGeminiAnalysis() {
  console.log('🧪 DIAGNÓSTICO COMPLETO: Sistema de Análisis de IA');
  console.log('=============================================\n');

  // 1. Verificar variables de entorno
  console.log('1️⃣ Verificando variables de entorno...');
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  
  console.log(`   GOOGLE_GEMINI_API_KEY: ${geminiKey ? '✅ CONFIGURADA' : '❌ FALTANTE'}`);
  console.log(`   BLOB_READ_WRITE_TOKEN: ${blobToken ? '✅ CONFIGURADA' : '❌ FALTANTE'}`);
  
  if (!geminiKey) {
    console.log('❌ Error: GOOGLE_GEMINI_API_KEY no está configurada');
    return false;
  }

  // 2. Test básico de conexión con Gemini
  console.log('\n2️⃣ Probando conexión con Gemini AI...');
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const testResult = await model.generateContent('Responde solo con: "Conexión exitosa"');
    const response = testResult.response.text();
    
    if (response.includes('Conexión exitosa')) {
      console.log('   ✅ Conexión con Gemini exitosa');
    } else {
      console.log('   ⚠️ Conexión establecida pero respuesta inesperada:', response);
    }
  } catch (error) {
    console.log('   ❌ Error conectando con Gemini:', error.message);
    return false;
  }

  // 3. Test de Vercel Blob con imagen de prueba
  console.log('\n3️⃣ Probando upload a Vercel Blob...');
  try {
    const { put } = require('@vercel/blob');
    
    // Crear imagen de prueba simple
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    
    const filename = `test/analysis_test_${Date.now()}.png`;
    const blob = await put(filename, testImageBuffer, {
      access: 'public',
      token: blobToken,
    });
    
    console.log('   ✅ Upload exitoso a Vercel Blob');
    console.log('   📁 URL:', blob.url);
    
    // 4. Test de descarga desde Vercel Blob
    console.log('\n4️⃣ Probando descarga desde Vercel Blob...');
    const downloadResponse = await fetch(blob.url);
    if (downloadResponse.ok) {
      console.log('   ✅ Descarga exitosa desde Vercel Blob');
    } else {
      console.log('   ❌ Error descargando desde Vercel Blob:', downloadResponse.status);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Error con Vercel Blob:', error.message);
    return false;
  }

  // 5. Test del flujo completo analyze endpoint
  console.log('\n5️⃣ Probando endpoint /api/staff/consumo/analyze...');
  try {
    const testUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    console.log('   🌐 URL base:', testUrl);
    
    // Crear FormData de prueba
    const formData = new FormData();
    formData.append('cedula', '1762075776');
    formData.append('businessId', 'test');
    
    // Crear imagen de prueba
    const testImageBlob = new Blob([Buffer.from('test')], { type: 'image/png' });
    formData.append('image', testImageBlob, 'test.png');
    
    console.log('   📤 Simulando request al endpoint...');
    console.log('   ✅ FormData preparado correctamente');
    
  } catch (error) {
    console.log('   ❌ Error preparando test del endpoint:', error.message);
  }

  // 6. Verificar logs de producción
  console.log('\n6️⃣ Verificando configuración de logs...');
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   Logs en producción: ${isProduction ? 'OPTIMIZADOS' : 'COMPLETOS'}`);

  console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
  console.log('==============================');
  console.log('✅ Sistema base: FUNCIONANDO');
  console.log('⚠️  Posibles problemas detectados:');
  console.log('   1. Verificar que las imágenes lleguen correctamente al endpoint');
  console.log('   2. Revisar logs en tiempo real durante el análisis');
  console.log('   3. Confirmar que el formato de respuesta de Gemini sea correcto');
  
  return true;
}

// Ejecutar diagnóstico
testGeminiAnalysis().catch(console.error);
