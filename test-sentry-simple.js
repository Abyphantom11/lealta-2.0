// Script simple de test para Sentry
// Ejecutar con: node test-sentry-simple.js

const testSentry = async () => {
  console.log('🚀 Iniciando test de Sentry...');
  
  // Verificar variables de entorno
  console.log('DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ Configurado' : '❌ No configurado');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  try {
    // Intentar cargar Sentry
    const Sentry = require('@sentry/node');
    
    // Inicializar Sentry
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      debug: true,
    });
    
    console.log('✅ Sentry inicializado correctamente');
    
    // Enviar evento de prueba
    console.log('📤 Enviando mensaje de prueba...');
    const eventId = Sentry.captureMessage('Test desde script Node.js', 'info');
    console.log('📨 Evento enviado con ID:', eventId);
    
    // Enviar error de prueba
    console.log('📤 Enviando error de prueba...');
    const errorEventId = Sentry.captureException(new Error('Error de prueba desde script Node.js'));
    console.log('🚨 Error enviado con ID:', errorEventId);
    
    // Esperar a que se envíen los eventos
    await Sentry.flush(2000);
    console.log('✅ Eventos enviados a Sentry');
    
  } catch (error) {
    console.error('❌ Error en test de Sentry:', error.message);
  }
};

testSentry();
