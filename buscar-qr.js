const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buscarQR() {
  try {
    const token = 'ig4gRl';
    
    // Buscar el QR
    const qr = await prisma.qRCode.findUnique({
      where: { token },
      include: {
        business: {
          select: { 
            id: true,
            name: true 
          }
        },
        reserva: {
          select: { 
            id: true, 
            cliente: true, 
            fecha: true, 
            hora: true,
            numeroPersonas: true,
            estado: true
          }
        }
      }
    });

    if (qr) {
      console.log('✅ QR ENCONTRADO:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 Token:', qr.token);
      console.log('🏢 Business ID:', qr.businessId);
      console.log('🏪 Negocio:', qr.business?.name || 'Sin nombre');
      console.log('📅 Creado:', qr.createdAt);
      console.log('⏰ Expira:', qr.expiresAt);
      console.log('📊 Estado:', qr.isActive ? '✅ ACTIVO' : '❌ INACTIVO');
      
      if (qr.reserva) {
        console.log('\n📋 RESERVA ASOCIADA:');
        console.log('  ID:', qr.reserva.id);
        console.log('  Cliente:', qr.reserva.cliente?.nombre || 'Sin nombre');
        console.log('  Fecha:', qr.reserva.fecha);
        console.log('  Hora:', qr.reserva.hora);
        console.log('  Personas:', qr.reserva.numeroPersonas);
        console.log('  Estado:', qr.reserva.estado);
      } else {
        console.log('\n⚠️  Sin reserva asociada');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ QR NO ENCONTRADO en la base de datos');
      console.log('\n🔍 Buscando QRs similares...');
      
      // Buscar QRs con tokens similares
      const similares = await prisma.qRCode.findMany({
        where: {
          OR: [
            { token: { contains: 'ig4' } },
            { token: { contains: 'gRl' } }
          ]
        },
        take: 5,
        select: {
          token: true,
          businessId: true,
          isActive: true,
          createdAt: true
        }
      });
      
      if (similares.length > 0) {
        console.log('\n📋 QRs similares encontrados:');
        similares.forEach((qr, i) => {
          console.log(`  ${i + 1}. ${qr.token} - ${qr.isActive ? '✅' : '❌'} - ${qr.createdAt.toISOString()}`);
        });
      }
      
      // Mostrar últimos 5 QRs
      console.log('\n📋 Últimos 5 QRs en la BD:');
      const ultimos = await prisma.qRCode.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          token: true,
          businessId: true,
          isActive: true,
          createdAt: true
        }
      });
      
      ultimos.forEach((qr, i) => {
        console.log(`  ${i + 1}. ${qr.token} - ${qr.isActive ? '✅' : '❌'} - ${qr.createdAt.toISOString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarQR();
