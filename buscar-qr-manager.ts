import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function buscarQRManager() {
  try {
    const token = 'ig4gRl';
    
    // Buscar en QRLink (QR Manager)
    const qr = await prisma.qRLink.findUnique({
      where: { id: token },
      include: {
        Business: {
          select: { 
            id: true,
            name: true 
          }
        }
      }
    });

    if (qr) {
      console.log('✅ QR DE QR MANAGER ENCONTRADO:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔗 ID/Token:', qr.id);
      console.log('🔗 Short ID:', qr.shortId);
      console.log('📝 Nombre:', qr.name);
      console.log('📄 Descripción:', qr.description || 'Sin descripción');
      console.log('🏢 Business ID:', qr.businessId);
      console.log('🏪 Negocio:', qr.Business?.name || 'Sin nombre');
      console.log('� Target URL:', qr.targetUrl);
      console.log('� Backup URL:', qr.backupUrl || 'Sin backup');
      console.log('📊 Estado:', qr.isActive ? '✅ ACTIVO' : '❌ INACTIVO');
      console.log('⏰ Expira:', qr.expiresAt ? qr.expiresAt.toISOString() : 'Sin expiración');
      console.log('� Creado:', qr.createdAt.toISOString());
      console.log('🔄 Actualizado:', qr.updatedAt.toISOString());
      console.log('👁️  Total Clicks:', qr.clickCount);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ QR NO ENCONTRADO en QRLink (QR Manager)');
      console.log('\n🔍 Buscando QRs similares en QR Manager...');
      
      // Buscar QRs con IDs similares
      const similares = await prisma.qRLink.findMany({
        where: {
          OR: [
            { id: { contains: 'ig4' } },
            { id: { contains: 'gRl' } }
          ]
        },
        take: 5,
        select: {
          id: true,
          name: true,
          businessId: true,
          isActive: true,
          clickCount: true,
          createdAt: true
        }
      });
      
      if (similares.length > 0) {
        console.log('\n📋 QRs similares encontrados:');
        for (const [i, qr] of similares.entries()) {
          console.log(`  ${i + 1}. ${qr.id} - ${qr.name} - Clicks: ${qr.clickCount} - ${qr.isActive ? '✅' : '❌'}`);
        }
      }
      
      // Mostrar últimos 5 QRs
      console.log('\n📋 Últimos 5 QRs en QR Manager:');
      const ultimos = await prisma.qRLink.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          businessId: true,
          isActive: true,
          clickCount: true,
          createdAt: true
        }
      });
      
      for (const [i, qr] of ultimos.entries()) {
        console.log(`  ${i + 1}. ${qr.id} - ${qr.name} - Clicks: ${qr.clickCount} - ${qr.isActive ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarQRManager();
