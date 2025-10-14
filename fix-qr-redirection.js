const { PrismaClient } = require('@prisma/client');

async function fixQRRedirection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Corrigiendo redirección del QR...\n');
    
    // Obtener el QR actual
    const qrLink = await prisma.qRLink.findFirst({
      where: {
        shortId: 'ig4gRl'
      },
      include: {
        business: {
          select: {
            name: true,
            slug: true,
            subdomain: true
          }
        }
      }
    });
    
    if (!qrLink) {
      console.log('❌ No se encontró el QR con shortId: ig4gRl');
      return;
    }
    
    console.log('📋 QR Actual:');
    console.log(`ID: ${qrLink.id}`);
    console.log(`Short ID: ${qrLink.shortId}`);
    console.log(`Nombre: ${qrLink.name}`);
    console.log(`Target URL actual: ${qrLink.targetUrl}`);
    console.log(`Backup URL actual: ${qrLink.backupUrl}`);
    console.log(`Business: ${qrLink.business?.name || 'N/A'}`);
    console.log(`Business Slug: ${qrLink.business?.slug || 'N/A'}`);
    console.log(`Business Subdomain: ${qrLink.business?.subdomain || 'N/A'}\n`);
    
    // Determinar la URL correcta según el business
    let correctTargetUrl;
    let correctBackupUrl;
    
    // Si el QR es para "La Casa del Sabor"
    if (qrLink.business?.slug === 'la-casa-del-sabor' || qrLink.business?.subdomain === 'lacasadelsabor') {
      correctTargetUrl = 'https://lealta.app/la-casa-del-sabor/cliente/';
      correctBackupUrl = 'https://lealta.app/lacasadelsabor/cliente/';
    } else if (qrLink.business?.slug === 'casa-sabor-demo') {
      correctTargetUrl = 'https://lealta.app/casa-sabor-demo/cliente/';
      correctBackupUrl = 'https://lealta.app/la-casa-del-sabor/cliente/';
    } else {
      // URL genérica basada en el negocio asociado
      const businessSlug = qrLink.business?.slug || 'cliente';
      correctTargetUrl = `https://lealta.app/${businessSlug}/cliente/`;
      correctBackupUrl = 'https://lealta.app/cliente/';
    }
    
    console.log('🎯 URLs Correctas:');
    console.log(`Target URL sugerida: ${correctTargetUrl}`);
    console.log(`Backup URL sugerida: ${correctBackupUrl}\n`);
    
    // Verificar si necesita actualización
    const needsUpdate = qrLink.targetUrl !== correctTargetUrl || qrLink.backupUrl !== correctBackupUrl;
    
    if (!needsUpdate) {
      console.log('✅ El QR ya tiene las URLs correctas. No se necesita actualización.');
      return;
    }
    
    console.log('🔄 Actualizando QR...');
    
    // Actualizar el QR
    const updatedQR = await prisma.qRLink.update({
      where: {
        id: qrLink.id
      },
      data: {
        targetUrl: correctTargetUrl,
        backupUrl: correctBackupUrl,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ QR actualizado exitosamente!');
    console.log(`Nuevo Target URL: ${updatedQR.targetUrl}`);
    console.log(`Nuevo Backup URL: ${updatedQR.backupUrl}`);
    
    console.log('\n🔗 URL del QR para usar:');
    console.log(`https://lealta.app/r/${qrLink.shortId}`);
    
    console.log('\n📊 Resumen:');
    console.log('✅ El QR mantiene su mismo código (permanencia asegurada)');
    console.log('✅ Ahora redirecciona desde lealta.app');
    console.log('✅ URL de destino corregida');
    console.log('✅ URL de backup configurada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixQRRedirection();
