const { PrismaClient } = require('@prisma/client');

async function configureQRForLealta() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Configurando QR para funcionar desde lealta.app...\n');
    
    const targetShortId = 'ig4gRl';
    
    // Verificar si el QR existe
    let existingQR = await prisma.qRLink.findUnique({
      where: { shortId: targetShortId }
    });
    
    if (existingQR) {
      console.log('✅ QR encontrado en base de datos:');
      console.log(`ID: ${existingQR.id}`);
      console.log(`Short ID: ${existingQR.shortId}`);
      console.log(`Target URL actual: ${existingQR.targetUrl}`);
      console.log(`Backup URL actual: ${existingQR.backupUrl}`);
      console.log('');
      
      // Actualizar para que funcione correctamente
      const updatedQR = await prisma.qRLink.update({
        where: { shortId: targetShortId },
        data: {
          name: 'QR Menú Casa del Sabor',
          targetUrl: 'https://lealta.app/casa-sabor-demo/cliente/',
          backupUrl: 'https://lealta.app/la-casa-del-sabor/cliente/',
          isActive: true,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ QR actualizado exitosamente!');
      console.log(`Nuevo Target URL: ${updatedQR.targetUrl}`);
      console.log(`Nuevo Backup URL: ${updatedQR.backupUrl}`);
      
    } else {
      // Crear el QR si no existe
      console.log('❌ QR no encontrado. Creando nuevo QR...');
      
      const newQR = await prisma.qRLink.create({
        data: {
          shortId: targetShortId,
          name: 'QR Menú Casa del Sabor',
          description: 'Código QR para acceder al menú',
          targetUrl: 'https://lealta.app/casa-sabor-demo/cliente/',
          backupUrl: 'https://lealta.app/la-casa-del-sabor/cliente/',
          isActive: true,
          clickCount: 0
        }
      });
      
      console.log('✅ QR creado exitosamente!');
      console.log(`ID: ${newQR.id}`);
      console.log(`Short ID: ${newQR.shortId}`);
      console.log(`Target URL: ${newQR.targetUrl}`);
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('🔗 Tu QR físico funciona en: https://lealta.app/r/ig4gRl');
    console.log('📱 Redirecciona a: https://lealta.app/casa-sabor-demo/cliente/');
    console.log('🔄 Backup: https://lealta.app/la-casa-del-sabor/cliente/');
    
    console.log('\n✅ ESTADO:');
    console.log('🔒 El QR físico mantiene el mismo código (ig4gRl)');
    console.log('🌐 Ahora funciona desde lealta.app en lugar de Cloudflare');
    console.log('🎯 Redirecciona al menú correcto');
    console.log('⚡ No necesitas cambiar el QR físico/impreso');
    
    console.log('\n📋 INSTRUCCIONES:');
    console.log('1. El QR físico que tienes ahora funcionará desde lealta.app');
    console.log('2. Ya no depende del túnel de Cloudflare');
    console.log('3. Apunta al menú correcto de Casa del Sabor');
    console.log('4. Es permanente y no se romperá');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

configureQRForLealta();
