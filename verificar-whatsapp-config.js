/**
 * 🔍 Script para verificar configuración de WhatsApp/Twilio
 * Ejecutar con: node verificar-whatsapp-config.js
 */

require('dotenv').config({ path: '.env.local' });

const twilio = require('twilio');

async function verificarConfiguracion() {
  console.log('\n📱 VERIFICACIÓN DE CONFIGURACIÓN WHATSAPP\n');
  console.log('='.repeat(50));

  // 1. Verificar variables de entorno
  console.log('\n🔐 Variables de Entorno:');
  
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    sandboxMode: process.env.TWILIO_WHATSAPP_SANDBOX,
    verifiedNumbers: process.env.TWILIO_VERIFIED_NUMBERS,
  };

  console.log(`  TWILIO_ACCOUNT_SID: ${config.accountSid ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  TWILIO_AUTH_TOKEN: ${config.authToken ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  TWILIO_WHATSAPP_NUMBER: ${config.whatsappNumber || '❌ No configurado'}`);
  console.log(`  TWILIO_WHATSAPP_SANDBOX: ${config.sandboxMode}`);

  // 2. Detectar modo
  console.log('\n📊 Modo Actual:');
  const isSandbox = config.sandboxMode === 'true' || 
                    config.whatsappNumber?.includes('+14155238886');
  
  if (isSandbox) {
    console.log('  🧪 MODO SANDBOX - Solo números verificados');
    console.log('  ⚠️ No puedes enviar a tu base de datos completa');
    
    if (config.verifiedNumbers) {
      const numeros = config.verifiedNumbers.split(',');
      console.log(`\n  📋 Números verificados (${numeros.length}):`);
      numeros.forEach(n => console.log(`    - ${n.trim()}`));
    }
  } else {
    console.log('  🚀 MODO PRODUCCIÓN - Puedes enviar a cualquier número');
    console.log('  ✅ Listo para enviar a tu base de datos');
  }

  // 3. Verificar conexión con Twilio
  console.log('\n🔌 Verificando conexión con Twilio...');
  
  if (!config.accountSid || !config.authToken) {
    console.log('  ❌ No se puede verificar - credenciales faltantes');
    return;
  }

  try {
    const client = twilio(config.accountSid, config.authToken);
    const account = await client.api.accounts(config.accountSid).fetch();
    
    console.log(`  ✅ Conexión exitosa`);
    console.log(`  📝 Cuenta: ${account.friendlyName}`);
    console.log(`  📊 Estado: ${account.status}`);
    console.log(`  📅 Creada: ${account.dateCreated}`);

    // 4. Verificar balance
    const balance = await client.balance.fetch();
    console.log(`  💰 Balance: ${balance.currency} ${balance.balance}`);

    // 5. Verificar templates (si está disponible)
    console.log('\n📝 Templates de WhatsApp:');
    try {
      const templates = await client.content.v1.contents.list({ limit: 10 });
      
      if (templates.length === 0) {
        console.log('  ℹ️ No hay templates configurados aún');
      } else {
        templates.forEach(t => {
          const status = t.approvalRequests?.status || 'unknown';
          const statusIcon = status === 'approved' ? '✅' : 
                            status === 'pending' ? '⏳' : 
                            status === 'rejected' ? '❌' : '❓';
          console.log(`  ${statusIcon} ${t.friendlyName || t.sid}`);
          console.log(`     SID: ${t.sid}`);
          console.log(`     Estado: ${status}`);
        });
      }
    } catch (e) {
      console.log('  ℹ️ No se pudo obtener lista de templates');
    }

  } catch (error) {
    console.log(`  ❌ Error de conexión: ${error.message}`);
  }

  // 6. Resumen y recomendaciones
  console.log('\n' + '='.repeat(50));
  console.log('📋 RESUMEN Y RECOMENDACIONES:\n');

  if (isSandbox) {
    console.log('🔴 ESTÁS EN MODO SANDBOX\n');
    console.log('Para enviar a tu base de datos necesitas:');
    console.log('  1. Esperar aprobación del template por Meta');
    console.log('  2. Obtener tu número de WhatsApp Business aprobado');
    console.log('  3. Cambiar TWILIO_WHATSAPP_NUMBER a tu número real');
    console.log('  4. Cambiar TWILIO_WHATSAPP_SANDBOX a "false"');
    console.log('\n📖 Ver guía completa: WHATSAPP_PRODUCCION_GUIA.md');
  } else {
    console.log('🟢 ESTÁS EN MODO PRODUCCIÓN\n');
    console.log('Puedes enviar mensajes a tu base de datos usando:');
    console.log('  - Templates aprobados por Meta (sin restricción)');
    console.log('  - Mensajes de sesión (solo si te escribieron en 24h)');
  }

  console.log('\n' + '='.repeat(50));
}

// Ejecutar
verificarConfiguracion().catch(console.error);
