const { PrismaClient } = require('@prisma/client');

async function createQRWithLealtaURL() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Creando QR que funcione desde lealta.app...\n');
    
    // Opción 1: Mantener el mismo shortId pero asegurar que funcione desde lealta.app
    const qrData = {
      shortId: 'ig4gRl',
      name: 'QR Menú Casa del Sabor',
      description: 'Código QR para acceder al menú',
      targetUrl: 'https://lealta.app/casa-sabor-demo/cliente/',
      backupUrl: 'https://lealta.app/la-casa-del-sabor/cliente/',
      isActive: true
    };
    
    // Verificar si ya existe
    const existingQR = await prisma.qRLink.findUnique({
      where: { shortId: qrData.shortId }
    });
    
    if (existingQR) {
      console.log('✅ QR existente encontrado. Actualizando...');
      await prisma.qRLink.update({
        where: { shortId: qrData.shortId },
        data: {
          targetUrl: qrData.targetUrl,
          backupUrl: qrData.backupUrl,
          isActive: true,
          updatedAt: new Date()
        }
      });
    } else {
      console.log('📝 Creando nuevo QR...');
      await prisma.qRLink.create({ data: qrData });
    }
    
    console.log('✅ QR configurado exitosamente!');
    console.log('\n🔗 URLS FUNCIONALES:');
    console.log(`📱 URL de lealta.app: https://lealta.app/r/ig4gRl`);
    console.log(`🎯 Destino: ${qrData.targetUrl}`);
    
    console.log('\n🔧 SOLUCIONES DISPONIBLES:');
    console.log('');
    console.log('OPCIÓN A: Generar nuevo QR con URL de lealta.app');
    console.log('- Descargar un QR que apunte a: https://lealta.app/r/ig4gRl');
    console.log('- Este será permanente y no dependerá de Cloudflare');
    console.log('');
    console.log('OPCIÓN B: Interceptar URL de Cloudflare (más complejo)');
    console.log('- Configurar lealta.app para manejar la URL de Cloudflare');
    console.log('- Requiere configuración adicional de dominio');
    
    console.log('\n📋 RECOMENDACIÓN:');
    console.log('Generar un nuevo QR con la URL: https://lealta.app/r/ig4gRl');
    console.log('Este QR será idéntico en funcionalidad pero permanente');
    
    console.log('\n🎯 PRÓXIMO PASO:');
    console.log('¿Quieres que genere el código para crear el QR con la URL correcta?');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createQRWithLealtaURL();
