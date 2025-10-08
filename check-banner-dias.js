const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBannerDias() {
  try {
    console.log('🔍 Verificando banners y sus días...\n');
    
    const banners = await prisma.portalBanner.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        dia: true,
        active: true,
        businessId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total banners activos: ${banners.length}\n`);
    
    banners.forEach((banner, index) => {
      console.log(`${index + 1}. ${banner.title}`);
      console.log(`   📅 Día: ${banner.dia || 'NO ESPECIFICADO'}`);
      console.log(`   🏢 Business: ${banner.businessId}`);
      console.log(`   📅 Creado: ${banner.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Verificar día comercial actual
    const now = new Date();
    const hour = now.getHours();
    const dayIndex = now.getDay();
    const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    
    let currentBusinessDay;
    if (hour < 4) {
      // Antes de las 4 AM, es el día anterior
      const yesterdayIndex = (dayIndex - 1 + 7) % 7;
      currentBusinessDay = days[yesterdayIndex];
    } else {
      currentBusinessDay = days[dayIndex];
    }
    
    console.log(`\n⏰ Hora actual: ${now.toLocaleString()}`);
    console.log(`📅 Día comercial calculado: ${currentBusinessDay}`);
    console.log(`\n✅ Banners que DEBERÍAN mostrarse hoy (${currentBusinessDay}):`);
    
    const bannersHoy = banners.filter(b => 
      b.dia === currentBusinessDay || b.dia === null || b.dia === ''
    );
    
    if (bannersHoy.length === 0) {
      console.log('   ⚠️ NINGUNO - Los paneles deberían estar VACÍOS');
    } else {
      bannersHoy.forEach(b => {
        console.log(`   - ${b.title} (día: ${b.dia || 'sin especificar'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBannerDias();
