const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProgress() {
  // Mensajes enviados hoy - buscar por messageId de Twilio (MM...)
  const msgs = await prisma.whatsAppMessage.findMany({
    where: {
      createdAt: { gte: new Date('2025-11-27') }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  
  console.log('📊 PROGRESO DE CAMPAÑA WHATSAPP');
  console.log('================================');
  console.log('Total mensajes en DB:', msgs.length);
  
  if (msgs.length > 0) {
    const byStatus = msgs.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {});
    console.log('Por estado:', byStatus);
    console.log('Último mensaje:', {
      phone: msgs[0].phoneNumber,
      status: msgs[0].status,
      createdAt: msgs[0].createdAt
    });
  }
  
  // Última campaña
  const campaigns = await prisma.whatsAppCampaign.findMany({
    where: { createdAt: { gte: new Date('2025-11-27') } },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  
  if (campaigns[0]) {
    const c = campaigns[0];
    console.log('\n📋 Última campaña:');
    console.log('  ID:', c.id);
    console.log('  Nombre:', c.name);
    console.log('  Estado:', c.status);
    console.log('  Objetivo:', c.totalTargeted);
    console.log('  Enviados:', c.totalSent);
    console.log('  Entregados:', c.totalDelivered);
    console.log('  Fallidos:', c.totalFailed);
    console.log('  Progreso:', c.totalTargeted > 0 ? Math.round((c.totalSent / c.totalTargeted) * 100) + '%' : '0%');
    console.log('  Iniciada:', c.startedAt);
  }
  
  await prisma.$disconnect();
}

checkProgress();
