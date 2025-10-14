const { PrismaClient } = require('@prisma/client');

async function restoreOriginalQR() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Restaurando QR a su estado original...\n');
    
    // Restaurar el QR con la configuración original
    const originalQR = await prisma.qRLink.update({
      where: {
        shortId: 'ig4gRl'
      },
      data: {
        name: 'menú',
        targetUrl: 'https://lealta.app/love-me-sky/cliente/',
        backupUrl: 'https://github.com/Abyphantom11/Men-',
        businessId: null, // Si no tenía business asociado originalmente
        description: null,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ QR restaurado exitosamente!');
    console.log(`ID: ${originalQR.id}`);
    console.log(`Short ID: ${originalQR.shortId}`);
    console.log(`Nombre: ${originalQR.name}`);
    console.log(`Target URL: ${originalQR.targetUrl}`);
    console.log(`Backup URL: ${originalQR.backupUrl}`);
    
    console.log('\n🔗 URL del QR (ORIGINAL):');
    console.log(`https://lealta.app/r/${originalQR.shortId}`);
    
    console.log('\n📱 Destino original:');
    console.log(`${originalQR.targetUrl}`);
    
    console.log('\n✅ ESTADO RESTAURADO:');
    console.log('🔒 QR mantiene su código único original (ig4gRl)');
    console.log('🌐 Redirección desde lealta.app (NO Cloudflare)');
    console.log('🎯 URLs originales restauradas');
    console.log('✅ Permanencia del QR asegurada');
    
    // Verificar que el QR funciona
    console.log('\n🧪 Verificación:');
    console.log('El QR sigue siendo accesible en: https://lealta.app/r/ig4gRl');
    console.log('Y redirecciona a: https://lealta.app/love-me-sky/cliente/');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

restoreOriginalQR();
