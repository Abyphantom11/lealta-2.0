const { PrismaClient } = require('@prisma/client');

async function linkQRToBusiness() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔗 Vinculando QR con el business correcto...\n');
    
    // Buscar el business "La Casa del Sabor"
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { slug: 'la-casa-del-sabor' },
          { slug: 'casa-sabor-demo' },
          { name: { contains: 'Casa del Sabor' } }
        ]
      }
    });
    
    if (!business) {
      console.log('❌ No se encontró el business "La Casa del Sabor"');
      return;
    }
    
    console.log('🏢 Business encontrado:');
    console.log(`ID: ${business.id}`);
    console.log(`Nombre: ${business.name}`);
    console.log(`Slug: ${business.slug}`);
    console.log(`Subdomain: ${business.subdomain}\n`);
    
    // Obtener el QR actual
    const qrLink = await prisma.qRLink.findFirst({
      where: {
        shortId: 'ig4gRl'
      }
    });
    
    if (!qrLink) {
      console.log('❌ No se encontró el QR');
      return;
    }
    
    // Determinar las URLs correctas
    const correctTargetUrl = `https://lealta.app/${business.slug}/cliente/`;
    const correctBackupUrl = business.subdomain ? `https://lealta.app/${business.subdomain}/cliente/` : 'https://lealta.app/cliente/';
    
    console.log('🎯 Configuración correcta:');
    console.log(`Business ID: ${business.id}`);
    console.log(`Target URL: ${correctTargetUrl}`);
    console.log(`Backup URL: ${correctBackupUrl}\n`);
    
    // Actualizar el QR con el business correcto y URLs corregidas
    const updatedQR = await prisma.qRLink.update({
      where: {
        id: qrLink.id
      },
      data: {
        businessId: business.id,
        targetUrl: correctTargetUrl,
        backupUrl: correctBackupUrl,
        name: `QR Menú - ${business.name}`,
        description: `Código QR para acceder al menú de ${business.name}`,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ QR actualizado exitosamente!');
    console.log(`Nuevo Business ID: ${updatedQR.businessId}`);
    console.log(`Nuevo Target URL: ${updatedQR.targetUrl}`);
    console.log(`Nuevo Backup URL: ${updatedQR.backupUrl}`);
    console.log(`Nuevo Nombre: ${updatedQR.name}`);
    
    console.log('\n🔗 URL del QR (PERMANENTE):');
    console.log(`https://lealta.app/r/${qrLink.shortId}`);
    
    console.log('\n📱 Destino final:');
    console.log(`${correctTargetUrl}`);
    
    console.log('\n✅ RESUMEN FINAL:');
    console.log('🔒 El QR mantiene su código único (permanencia asegurada)');
    console.log('🌐 Redirección desde lealta.app (no Cloudflare)');
    console.log('🏢 Vinculado correctamente con el business');
    console.log('🎯 URLs de destino corregidas');
    console.log('🔄 Sistema de backup configurado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

linkQRToBusiness();
