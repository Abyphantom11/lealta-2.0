// 🧪 Test de Gemini AI - Verificar que la API funciona correctamente

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
    console.log('🧪 TESTING GEMINI AI CONFIGURATION');
    console.log('===================================');
    
    // Verificar que la API key está configurada
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log('❌ GOOGLE_GEMINI_API_KEY no está configurada');
        console.log('💡 Configura la variable en .env.local');
        process.exit(1);
    }
    
    console.log('✅ API Key encontrada:', apiKey.substring(0, 10) + '...');
    
    try {
        // Inicializar Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        console.log('🔄 Probando conexión con Gemini...');
        
        // Test simple
        const prompt = "Responde solo: OK";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Gemini AI respondió:', text.trim());
        console.log('🎉 ¡Gemini AI está funcionando correctamente!');
        
        // Test más complejo para Lealta
        console.log('🔄 Probando funcionalidad específica de Lealta...');
        
        const loyaltyPrompt = `
        Eres un asistente de un sistema de fidelización llamado Lealta.
        Un cliente ha acumulado 150 puntos comprando café.
        Sugiere una recompensa apropiada en una línea.
        `;
        
        const loyaltyResult = await model.generateContent(loyaltyPrompt);
        const loyaltyResponse = await loyaltyResult.response;
        const loyaltyText = loyaltyResponse.text();
        
        console.log('🎁 Sugerencia de recompensa:', loyaltyText.trim());
        console.log('🚀 ¡Listo para producción!');
        
    } catch (error) {
        console.log('❌ Error al conectar con Gemini AI:');
        console.log('Error:', error.message);
        
        if (error.message.includes('API_KEY_INVALID')) {
            console.log('💡 La API key parece ser inválida');
            console.log('🔧 Verifica en: https://makersuite.google.com/app/apikey');
        } else if (error.message.includes('PERMISSION_DENIED')) {
            console.log('💡 La API key no tiene permisos');
            console.log('🔧 Verifica que Gemini API esté habilitada');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            console.log('💡 Cuota excedida');
            console.log('🔧 Verifica tu plan en Google AI Studio');
        }
        
        process.exit(1);
    }
}

// Ejecutar test
console.log('Cargando variables de entorno...');
require('dotenv').config({ path: '.env.local' });

testGeminiAPI()
    .then(() => {
        console.log('\n🎯 RESUMEN:');
        console.log('✅ Gemini AI configurado correctamente');
        console.log('✅ Listo para deployment a producción');
        console.log('✅ IA funcionará en tu aplicación Lealta');
    })
    .catch(error => {
        console.log('\n❌ FALLÓ EL TEST:');
        console.log(error.message);
        process.exit(1);
    });
