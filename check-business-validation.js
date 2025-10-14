// Script para verificar la validación del business por slug
const fetch = require('node-fetch');

async function checkBusinessValidation() {
  console.log('🔍 VERIFICANDO VALIDACIÓN DE BUSINESS POR SLUG');
  console.log('='.repeat(50));
  
  const slug = 'casa-sabor-demo';
  
  try {
    console.log(`🧪 Probando validación para slug: ${slug}`);
    const response = await fetch(`http://localhost:3001/api/businesses/${slug}/validate`);
    
    if (response.ok) {
      const businessInfo = await response.json();
      console.log('✅ VALIDACIÓN EXITOSA:');
      console.log(JSON.stringify(businessInfo, null, 2));
      
      console.log('\n🎯 DATOS IMPORTANTES:');
      console.log(`ID: ${businessInfo.id}`);
      console.log(`Name: ${businessInfo.name}`);
      console.log(`Slug: ${businessInfo.slug}`);
      
      // Verificar si es el ID correcto para Casa Sabor Demo
      if (businessInfo.id === 'cmgf5px5f0000eyy0elci9yds') {
        console.log('✅ ID CORRECTO para Casa Sabor Demo');
      } else {
        console.log('❌ ID INCORRECTO - Esperado: cmgf5px5f0000eyy0elci9yds');
        console.log(`   Recibido: ${businessInfo.id}`);
      }
      
    } else {
      console.log(`❌ Error en validación: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Detalles: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

checkBusinessValidation().catch(console.error);
