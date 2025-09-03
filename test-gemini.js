/**
 * Script de prueba para verificar la integración con Google Gemini
 * Ejecutar con: npm run test-ai
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGeminiIntegration() {
  console.log('🧪 Probando integración con Google Gemini...\n');

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error('❌ GOOGLE_GEMINI_API_KEY no encontrada en .env.local');
    console.log('📝 Agrega tu API key en el archivo .env.local:');
    console.log('   GOOGLE_GEMINI_API_KEY="tu-api-key-aqui"');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Texto de ticket de prueba
    const testTicket = `
      RESTAURANT LA PLAZA
      ==================
      Cajero: María González
      Hamburguesa Clásica    $12.50
      Papas Fritas          $4.75
      Coca Cola             $2.25
      ==================
      SUBTOTAL:            $19.50
      IMPUESTO:            $1.95
      TOTAL:               $21.45
      ==================
      Atendido por: María González
      Gracias por su visita!
    `;

    const prompt = `
      Analiza este ticket de venta y extrae la información en formato JSON:
      
      Texto del ticket:
      "${testTicket}"
      
      Devuelve SOLO un JSON válido con esta estructura:
      {
        "empleado": "nombre del empleado/cajero/vendedor (o 'No detectado' si no encuentras)",
        "total": número (monto total de la compra),
        "productos": [
          {
            "name": "nombre del producto",
            "price": número (precio del producto),
            "line": "línea original del ticket"
          }
        ]
      }
      
      Reglas:
      - Busca nombres de empleados, cajeros, vendedores en el ticket
      - Si no encuentras el total, devuelve 0
      - Si no encuentras productos, devuelve array vacío
      - Solo números para precios, sin símbolos de moneda
      - Responde SOLO con el JSON, sin explicaciones adicionales
    `;

    console.log('📤 Enviando prompt a Gemini...');
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log('📥 Respuesta cruda de Gemini:');
    console.log(response);

    // Clean up response (remove markdown formatting)
    const cleanedResponse = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    console.log('\n🧹 Respuesta limpia:');
    console.log(cleanedResponse);

    console.log('\n🔍 Parseando JSON...');
    const parsedData = JSON.parse(cleanedResponse);

    console.log('\n✅ PRUEBA EXITOSA!');
    console.log('📊 Datos extraídos:');
    console.log(`   � Empleado: ${parsedData.empleado}`);
    console.log(`   �💰 Total: $${parsedData.total}`);
    console.log(`   📦 Productos encontrados: ${parsedData.productos.length}`);
    
    parsedData.productos.forEach((producto, index) => {
      console.log(`   ${index + 1}. ${producto.name} - $${producto.price}`);
    });

    console.log('\n🎉 La integración con Google Gemini está funcionando correctamente!');
    console.log('🚀 Ya puedes usar el sistema de captura automática con confirmación en el módulo staff.');

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('\n💡 Verifica que tu API key sea válida:');
      console.log('   1. Ve a https://makersuite.google.com/app/apikey');
      console.log('   2. Crea una nueva API key');
      console.log('   3. Cópiala en tu archivo .env.local');
    }
  }
}

testGeminiIntegration();
