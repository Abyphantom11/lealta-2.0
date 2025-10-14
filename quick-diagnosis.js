// Script de diagnóstico rápido para el problema de carga infinita
const fetch = require('node-fetch');

async function quickDiagnosis() {
  console.log('🚨 DIAGNÓSTICO RÁPIDO - PORTAL NO CARGA');
  console.log('='.repeat(50));
  
  const businessId = 'cmgf5px5f0000eyy0elci9yds';
  
  try {
    console.log('1️⃣ Probando API del portal...');
    
    const timestamp = Date.now();
    const response = await fetch(
      `http://localhost:3001/api/portal/config-v2?businessId=${businessId}&t=${timestamp}`,
      {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'node-fetch'
        },
        timeout: 10000 // 10 segundos timeout
      }
    );
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API responde correctamente');
      console.log(`   📊 Datos: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
    } else {
      console.log('   ❌ API falló');
      const errorText = await response.text();
      console.log(`   Error: ${errorText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log('   ❌ Error de conexión:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   🔥 PROBLEMA: Servidor Next.js no está corriendo en puerto 3001');
      console.log('   💡 SOLUCIÓN: Ejecutar "npm run dev" o verificar puerto');
    }
  }
  
  console.log('\n2️⃣ Verificando servidor...');
  
  try {
    const healthCheck = await fetch('http://localhost:3001/api/health');
    if (healthCheck.ok) {
      console.log('   ✅ Servidor responde en puerto 3001');
    }
  } catch (e) {
    console.log('   ❌ Servidor NO responde en puerto 3001');
    
    // Probar puerto 3000
    try {
      const fallbackCheck = await fetch('http://localhost:3000/api/health');
      if (fallbackCheck.ok) {
        console.log('   ⚠️ Servidor está en puerto 3000, no 3001');
      }
    } catch (e2) {
      console.log('   ❌ Servidor NO responde en puerto 3000 tampoco');
    }
  }
  
  console.log('\n🎯 ACCIONES INMEDIATAS:');
  console.log('1. Verificar que el servidor esté corriendo');
  console.log('2. Revisar consola del navegador para errores');
  console.log('3. Verificar que la API del portal funcione');
}

quickDiagnosis().catch(console.error);
