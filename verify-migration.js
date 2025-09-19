const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🔍 Verificando que las recompensas del usuario aparezcan correctamente...');
    
    // Obtener recompensas de la base de datos
    const recompensas = await prisma.portalRecompensa.findMany({
      where: { businessId, active: true },
      orderBy: { orden: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        pointsCost: true,
        active: true,
        imageUrl: true
      }
    });
    
    console.log('\n🎁 Recompensas en la base de datos:');
    recompensas.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`);
      console.log(`     Puntos: ${r.pointsCost}`);
      console.log(`     Descripción: ${r.description}`);
      console.log(`     Activo: ${r.active}`);
      console.log(`     ID: ${r.id}`);
      console.log('');
    });
    
    // Simular respuesta de API v2 con dual compatibility
    console.log('📋 Respuesta API v2 (con compatibilidad dual):');
    const apiResponse = recompensas.map(r => ({
      // Campos en español (para componentes existentes)
      id: r.id,
      titulo: r.title,
      descripcion: r.description,
      puntosRequeridos: r.pointsCost,
      activo: r.active,
      imagenUrl: r.imageUrl,
      
      // Campos en inglés (compatibilidad)
      title: r.title,
      description: r.description,
      pointsCost: r.pointsCost,
      isActive: r.active,
      imageUrl: r.imageUrl
    }));
    
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Verificar que estén las recompensas esperadas
    const expectedRewards = ['werwr', 'dsfsf'];
    const foundRewards = recompensas.map(r => r.title);
    
    console.log('\n✅ Verificación:');
    expectedRewards.forEach(expected => {
      const found = foundRewards.includes(expected);
      console.log(`  ${expected}: ${found ? '✅ ENCONTRADO' : '❌ FALTANTE'}`);
    });
    
    if (expectedRewards.every(r => foundRewards.includes(r))) {
      console.log('\n🎉 ¡ÉXITO! Todas las recompensas del usuario están ahora en la base de datos y aparecerán en el portal cliente.');
    } else {
      console.log('\n⚠️ Faltan algunas recompensas. Revisa la migración.');
    }
    
  } catch (error) {
    console.error('❌ Error verificando migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
