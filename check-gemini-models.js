// 🔍 Verificar modelos disponibles en Gemini AI

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function listAvailableModels() {
    console.log('🔍 VERIFICANDO MODELOS DISPONIBLES');
    console.log('=================================');
    
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log('❌ GOOGLE_GEMINI_API_KEY no está configurada');
        return;
    }
    
    console.log('✅ API Key encontrada:', apiKey.substring(0, 10) + '...');
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Probar diferentes modelos comunes
        const modelsToTest = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro',
            'gemini-pro-vision',
            'models/gemini-1.5-flash',
            'models/gemini-1.5-pro'
        ];
        
        console.log('🔄 Probando modelos disponibles...\n');
        
        for (const modelName of modelsToTest) {
            try {
                console.log(`Probando: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const result = await model.generateContent("Test");
                const response = await result.response;
                const text = response.text();
                
                console.log(`✅ ${modelName} - FUNCIONA`);
                console.log(`   Respuesta: ${text.substring(0, 50)}...`);
                
                // Si funciona, este es el modelo a usar
                console.log(`\n🎯 MODELO RECOMENDADO: ${modelName}\n`);
                break;
                
            } catch (error) {
                console.log(`❌ ${modelName} - Error: ${error.message.substring(0, 100)}...`);
            }
        }
        
    } catch (error) {
        console.log('❌ Error general:', error.message);
        
        if (error.message.includes('API_KEY_INVALID')) {
            console.log('\n💡 SOLUCIÓN: La API key parece inválida');
            console.log('🔧 Ve a: https://makersuite.google.com/app/apikey');
            console.log('🔧 Verifica que esté habilitada para Gemini API');
        }
    }
}

listAvailableModels();
