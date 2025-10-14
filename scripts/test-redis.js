/**
 * 🧪 SCRIPT DE PRUEBA PARA UPSTASH REDIS
 * Verifica que la conexión y rate limiting funcionen correctamente
 */

const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");

async function testRedisConnection() {
  console.log('🔄 Probando conexión a Upstash Redis...\n');
  
  // Cargar variables de entorno
  require('dotenv').config({ path: '.env.local' });
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.log('❌ ERROR: Variables de Redis no configuradas');
    console.log('Asegúrate de configurar en .env.local:');
    console.log('UPSTASH_REDIS_REST_URL=tu-url');
    console.log('UPSTASH_REDIS_REST_TOKEN=tu-token');
    return;
  }
  
  try {
    // 1. Probar conexión básica
    console.log('1️⃣ Probando conexión básica...');
    const redis = new Redis({ url, token });
    
    await redis.set('test-key', 'Hello from Lealta!');
    const result = await redis.get('test-key');
    
    if (result === 'Hello from Lealta!') {
      console.log('✅ Conexión básica: OK');
    } else {
      console.log('❌ Conexión básica: FALLÓ');
      return;
    }
    
    // 2. Probar rate limiting
    console.log('\n2️⃣ Probando rate limiting...');
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
    });
    
    for (let i = 1; i <= 7; i++) {
      const { success, limit, remaining, reset } = await ratelimit.limit('test-ip');
      console.log(`Request ${i}: ${success ? '✅ PERMITIDO' : '❌ BLOQUEADO'} (${remaining}/${limit} restantes)`);
      
      if (i <= 5 && !success) {
        console.log('❌ ERROR: Rate limiting bloqueó request que debería ser permitido');
        return;
      }
      
      if (i > 5 && success) {
        console.log('❌ ERROR: Rate limiting permitió request que debería ser bloqueado');
        return;
      }
    }
    
    console.log('\n✅ Rate limiting: OK');
    
    // 3. Limpiar datos de prueba
    console.log('\n3️⃣ Limpiando datos de prueba...');
    await redis.del('test-key');
    console.log('✅ Limpieza: OK');
    
    console.log('\n🎉 ¡TODAS LAS PRUEBAS EXITOSAS!');
    console.log('Redis está configurado correctamente y listo para producción.');
    
  } catch (error) {
    console.log('❌ ERROR en la prueba:');
    console.log(error.message);
    
    if (error.message.includes('unauthorized')) {
      console.log('\n💡 Solución: Verifica que tu token de Upstash sea correcto');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Solución: Verifica tu conexión a internet y la URL de Upstash');
    }
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  testRedisConnection();
}

module.exports = { testRedisConnection };
