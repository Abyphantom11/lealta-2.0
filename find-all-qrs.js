const { PrismaClient } = require('@prisma/client');

async function findAllQRs() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Buscando TODOS los QRs en la base de datos...\n');
    
    // Buscar en QRLink
    const qrLinks = await prisma.qRLink.findMany({
      include: {
        business: {
          select: {
            name: true,
            slug: true,
            subdomain: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 QRLinks encontrados: ${qrLinks.length}`);
    
    if (qrLinks.length > 0) {
      console.log('\n=== QR LINKS ===');
      qrLinks.forEach((qr, index) => {
        console.log(`--- QR Link ${index + 1} ---`);
        console.log(`ID: ${qr.id}`);
        console.log(`Short ID: ${qr.shortId}`);
        console.log(`Nombre: ${qr.name}`);
        console.log(`Target URL: ${qr.targetUrl}`);
        console.log(`Backup URL: ${qr.backupUrl}`);
        console.log(`URL Completa: https://lealta.app/r/${qr.shortId}`);
        console.log(`Business: ${qr.business?.name || 'N/A'}`);
        console.log(`Clicks: ${qr.clickCount}`);
        console.log(`Creado: ${qr.createdAt}`);
        console.log('');
      });
    }
    
    // Buscar en ReservationQRCode (si existe)
    try {
      const reservationQRs = await prisma.reservationQRCode.findMany({
        include: {
          business: {
            select: {
              name: true,
              slug: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`📊 Reservation QRs encontrados: ${reservationQRs.length}`);
      
      if (reservationQRs.length > 0) {
        console.log('\n=== RESERVATION QR CODES ===');
        reservationQRs.forEach((qr, index) => {
          console.log(`--- Reservation QR ${index + 1} ---`);
          console.log(`ID: ${qr.id}`);
          console.log(`QR Code: ${qr.qrCode}`);
          console.log(`URL: ${qr.url || 'N/A'}`);
          console.log(`Business: ${qr.business?.name || 'N/A'}`);
          console.log(`Creado: ${qr.createdAt}`);
          console.log('');
        });
      }
    } catch (e) {
      console.log('ℹ️ No hay tabla ReservationQRCode o está vacía');
    }
    
    // Buscar en otras tablas relacionadas con QR
    try {
      const qrClicks = await prisma.qRClick.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      if (qrClicks.length > 0) {
        console.log('\n=== QR CLICKS RECIENTES ===');
        qrClicks.forEach((click, index) => {
          console.log(`Click ${index + 1}: QR ${click.qrLinkId} - ${click.createdAt}`);
        });
      }
    } catch (e) {
      console.log('ℹ️ No hay datos de clicks de QR');
    }
    
    console.log('\n🔍 RESUMEN:');
    console.log(`Total QR Links: ${qrLinks.length}`);
    console.log('\n❓ PREGUNTA IMPORTANTE:');
    console.log('¿El QR de la imagen coincide con alguno de los mostrados arriba?');
    console.log('Si no, significa que el QR físico apunta a una URL que no está registrada en nuestra BD.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findAllQRs();
