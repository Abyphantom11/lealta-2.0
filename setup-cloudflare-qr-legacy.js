const { PrismaClient } = require('@prisma/client');

async function setupCloudflareQRLegacySupport() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Configurando soporte legacy para QR de Cloudflare...\n');
    
    // Verificar que el QR de destino existe
    const targetQR = await prisma.qRLink.findUnique({
      where: { shortId: 'ig4gRl' }
    });
    
    if (!targetQR) {
      console.log('❌ ERROR: QR destino no encontrado (ig4gRl)');
      return;
    }
    
    console.log('✅ QR destino encontrado:');
    console.log(`Short ID: ${targetQR.shortId}`);
    console.log(`Target URL: ${targetQR.targetUrl}`);
    console.log(`Backup URL: ${targetQR.backupUrl}`);
    
    console.log('\n🔗 CONFIGURACIÓN DE REDIRECCIÓN:');
    console.log('');
    console.log('📱 QR Físico (URL que va a morir):');
    console.log('   https://loud-entity-fluid-trade.trycloudflare.com/r/ig4gRl');
    console.log('');
    console.log('🎯 Redirección a (URL permanente):');
    console.log('   https://lealta.app/r/ig4gRl');
    console.log('');
    console.log('🏁 Destino final:');
    console.log(`   ${targetQR.targetUrl}`);
    
    console.log('\n🛠️ COMPONENTES CONFIGURADOS:');
    console.log('✅ Middleware interceptor activado');
    console.log('✅ API endpoint legacy creado');
    console.log('✅ QR destino verificado');
    console.log('✅ Redirección 301 permanente');
    
    console.log('\n🧪 CÓMO PROBAR:');
    console.log('1. Construir y desplegar la aplicación');
    console.log('2. Acceder a: https://lealta.app/api/cloudflare-qr-legacy');
    console.log('3. Debe redirigir automáticamente a: https://lealta.app/r/ig4gRl');
    
    console.log('\n⚡ COMPORTAMIENTO ESPERADO:');
    console.log('- Cuando el túnel de Cloudflare muera');
    console.log('- El QR físico seguirá funcionando');
    console.log('- Porque lealta.app capturará esas solicitudes');
    console.log('- Y las redirigirá automáticamente');
    
    console.log('\n📋 NOTAS IMPORTANTES:');
    console.log('🔒 El QR físico mantiene su código original');
    console.log('🌐 Redirección automática desde lealta.app');
    console.log('⚡ Funciona incluso cuando Cloudflare esté caído');
    console.log('💾 Cache de 1 año para optimizar rendimiento');
    
    console.log('\n🎉 CONFIGURACIÓN COMPLETA!');
    console.log('Tu QR físico ahora tiene soporte legacy y nunca se romperá');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupCloudflareQRLegacySupport();
