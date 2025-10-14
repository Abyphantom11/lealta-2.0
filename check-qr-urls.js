const { PrismaClient } = require('@prisma/client');

async function checkQRUrls() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando QRs en la base de datos...\n');
    
    // Buscar QRs con URLs de Cloudflare
    const qrsWithUrls = await prisma.qRLink.findMany({
      select: {
        id: true,
        shortId: true,
        name: true,
        targetUrl: true,
        backupUrl: true,
        businessId: true,
        isActive: true,
        clickCount: true,
        createdAt: true,
        business: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Total QRs encontrados: ${qrsWithUrls.length}\n`);
    
    if (qrsWithUrls.length === 0) {
      console.log('❌ No se encontraron QRs en la base de datos');
      return;
    }
    
    // Analizar URLs de Cloudflare vs lealta.app
    const cloudflareQRs = qrsWithUrls.filter(qr => 
      qr.targetUrl?.includes('cloudflare') || 
      qr.targetUrl?.includes('tunnel') ||
      qr.targetUrl?.includes('.trycloudflare.com') ||
      qr.backupUrl?.includes('cloudflare') ||
      qr.backupUrl?.includes('tunnel') ||
      qr.backupUrl?.includes('.trycloudflare.com')
    );
    
    const lealtaQRs = qrsWithUrls.filter(qr => 
      qr.targetUrl?.includes('lealta.app') || 
      qr.backupUrl?.includes('lealta.app')
    );
    
    console.log(`🌩️ QRs con URLs de Cloudflare: ${cloudflareQRs.length}`);
    console.log(`🚀 QRs con URLs de lealta.app: ${lealtaQRs.length}`);
    console.log(`❓ QRs con otras URLs: ${qrsWithUrls.length - cloudflareQRs.length - lealtaQRs.length}\n`);
    
    // Mostrar detalles de cada QR
    qrsWithUrls.forEach((qr, index) => {
      console.log(`--- QR ${index + 1} ---`);
      console.log(`ID: ${qr.id}`);
      console.log(`Short ID: ${qr.shortId}`);
      console.log(`Nombre: ${qr.name}`);
      console.log(`Business: ${qr.business?.name || 'N/A'} (${qr.business?.slug || 'N/A'})`);
      console.log(`Target URL: ${qr.targetUrl || 'N/A'}`);
      console.log(`Backup URL: ${qr.backupUrl || 'N/A'}`);
      console.log(`Activo: ${qr.isActive ? '✅' : '❌'}`);
      console.log(`Clicks: ${qr.clickCount}`);
      console.log(`Creado: ${qr.createdAt}`);
      
      // Detectar tipo de URL
      const isCloudflare = qr.targetUrl?.includes('cloudflare') || 
                          qr.targetUrl?.includes('tunnel') ||
                          qr.targetUrl?.includes('.trycloudflare.com') ||
                          qr.backupUrl?.includes('cloudflare') ||
                          qr.backupUrl?.includes('tunnel') ||
                          qr.backupUrl?.includes('.trycloudflare.com');
      
      const isLealta = qr.targetUrl?.includes('lealta.app') || 
                      qr.backupUrl?.includes('lealta.app');
      
      if (isCloudflare) {
        console.log('🔥 NECESITA MIGRACIÓN → lealta.app');
      } else if (isLealta) {
        console.log('✅ YA USA lealta.app');
      } else {
        console.log('❓ URL desconocida');
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQRUrls();
