const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function buscarQREspecifico() {
  try {
    const shortId = 'ig4gRl';
    const url = 'https://lealta.app/r/ig4gRl';
    
    console.log('🔍 BUSCANDO QR ESPECÍFICO: ' + shortId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Verificar si la tabla QRLink existe
    let qrLinkExists = false;
    try {
      await prisma.$queryRaw`SELECT 1 FROM "QRLink" LIMIT 1`;
      qrLinkExists = true;
    } catch (e) {
      console.log('❌ Tabla "QRLink" NO EXISTE en la base de datos');
    }

    if (qrLinkExists) {
      console.log('✅ Tabla "QRLink" existe, buscando...');
      
      // Buscar por shortId
      const qrByShortId = await prisma.$queryRaw`
        SELECT * FROM "QRLink" WHERE "shortId" = ${shortId}
      `;
      
      if (qrByShortId.length > 0) {
        console.log('✅ QR ENCONTRADO POR SHORT ID:');
        console.log(JSON.stringify(qrByShortId[0], null, 2));
      } else {
        console.log('❌ No encontrado con shortId: ' + shortId);
      }

      // Buscar por ID (por si acaso)
      const qrById = await prisma.$queryRaw`
        SELECT * FROM "QRLink" WHERE "id" = ${shortId}
      `;
      
      if (qrById.length > 0) {
        console.log('✅ QR ENCONTRADO POR ID:');
        console.log(JSON.stringify(qrById[0], null, 2));
      }

      // Listar todos los QRLinks
      console.log('');
      console.log('📋 LISTANDO TODOS LOS QR LINKS:');
      const allQRs = await prisma.$queryRaw`
        SELECT "id", "shortId", "name", "isActive", "clickCount", "createdAt" 
        FROM "QRLink" 
        ORDER BY "createdAt" DESC 
        LIMIT 10
      `;
      
      if (allQRs.length > 0) {
        console.log(`Total encontrados: ${allQRs.length}`);
        for (const qr of allQRs) {
          console.log(`  - ${qr.shortId} | ${qr.name} | Clicks: ${qr.clickCount} | ${qr.isActive ? '✅' : '❌'}`);
        }
      } else {
        console.log('  ⚠️ No hay QR Links en la base de datos');
      }

      // Contar total
      const totalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "QRLink"`;
      console.log('');
      console.log(`📊 Total de QR Links en BD: ${totalCount[0].count}`);
      
    } else {
      console.log('');
      console.log('💡 La tabla QRLink no existe, pero tal vez el QR está en otra tabla...');
      console.log('');
      
      // Buscar en otras tablas que podrían contener QRs
      console.log('🔍 Buscando en tablas alternativas...');
      
      // Buscar en ReservationQRCode
      const reservationQR = await prisma.reservationQRCode.findMany({
        where: {
          OR: [
            { qrToken: { contains: shortId } },
            { qrData: { contains: shortId } }
          ]
        },
        take: 5
      });
      
      if (reservationQR.length > 0) {
        console.log('✅ Encontrado en ReservationQRCode:');
        for (const qr of reservationQR) {
          console.log(`  - Token: ${qr.qrToken}`);
          console.log(`    Status: ${qr.status}`);
          console.log(`    Reservation ID: ${qr.reservationId}`);
        }
      } else {
        console.log('❌ No encontrado en ReservationQRCode');
      }
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarQREspecifico();
