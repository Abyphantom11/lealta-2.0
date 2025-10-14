import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQRLinks() {
  console.log('🌱 Seeding QR Links...');

  try {
    // Crear algunos QR links de ejemplo
    const qrLinks = [
      {
        shortId: 'demo01',
        name: 'Campaña Demo 1',
        description: 'Primer QR de demostración',
        targetUrl: 'https://www.google.com',
        backupUrl: 'https://www.github.com',
        isActive: true
      },
      {
        shortId: 'promo2024',
        name: 'Promoción Black Friday',
        description: 'Campaña especial de Black Friday',
        targetUrl: 'https://www.stackoverflow.com',
        backupUrl: 'https://www.reddit.com',
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      },
      {
        shortId: 'menu01',
        name: 'Menú Digital Restaurante',
        description: 'Acceso rápido al menú del restaurante',
        targetUrl: 'https://www.reddit.com',
        backupUrl: 'https://www.twitter.com',
        isActive: false
      }
    ];

    for (const qrData of qrLinks) {
      // Verificar si ya existe
      const existing = await prisma.qRLink.findUnique({
        where: { shortId: qrData.shortId }
      });

      if (!existing) {
        const created = await prisma.qRLink.create({
          data: qrData
        });
        console.log(`✅ QR Link creado: ${created.name} (${created.shortId})`);
      } else {
        console.log(`⚠️ QR Link ya existe: ${qrData.name} (${qrData.shortId})`);
      }
    }

    console.log('🎉 Seeding de QR Links completado');
  } catch (error) {
    console.error('❌ Error en seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedQRLinks();
}

export { seedQRLinks };
