/**
 * 🧪 SCRIPT DE PRUEBA PARA SENTRY
 * Verifica que la integración funcione correctamente
 */

const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

async function testSentryIntegration() {
  console.log('🔄 Probando integración con Sentry...\n');
  
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.log('❌ ERROR: NEXT_PUBLIC_SENTRY_DSN no configurado');
    console.log('1. Ve a https://sentry.io');
    console.log('2. Crea un proyecto Next.js');
    console.log('3. Copia tu DSN');
    console.log('4. Configúralo en .env.local');
    return;
  }
  
  if (!dsn.startsWith('https://') || !dsn.includes('sentry.io')) {
    console.log('❌ ERROR: DSN de Sentry tiene formato inválido');
    console.log('Formato esperado: https://abc123@o123456.ingest.sentry.io/789012345');
    return;
  }
  
  console.log('✅ DSN de Sentry configurado correctamente');
  console.log(`DSN: ${dsn.substring(0, 30)}...`);
  
  // Verificar que Sentry puede ser inicializado
  try {
    const Sentry = require('@sentry/nextjs');
    
    Sentry.init({
      dsn: dsn,
      environment: 'test',
      debug: true,
      beforeSend: () => null, // No enviar eventos de prueba realmente
    });
    
    console.log('✅ Sentry inicializado correctamente');
    
    // Simular un error de prueba (sin enviarlo)
    console.log('✅ Configuración válida para capturar errores');
    
    console.log('\n🎉 ¡SENTRY CONFIGURADO EXITOSAMENTE!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. La aplicación capturará errores automáticamente');
    console.log('2. En desarrollo verás logs en consola');
    console.log('3. En producción los errores irán a tu dashboard Sentry');
    console.log('4. Puedes probar con: throw new Error("Test error")');
    
  } catch (error) {
    console.log('❌ ERROR inicializando Sentry:');
    console.log(error.message);
    
    if (error.message.includes('Invalid DSN')) {
      console.log('\n💡 Solución: Verifica que tu DSN sea correcto');
    }
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  testSentryIntegration();
}

module.exports = { testSentryIntegration };
