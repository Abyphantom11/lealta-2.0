const fetch = require('node-fetch');

async function diagnosticoCompleto() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🩺 DIAGNÓSTICO COMPLETO DE PROMOCIONES');
    console.log('======================================');
    
    // 1. Verificar estado en PostgreSQL directamente
    console.log('\n📊 1. Estado en PostgreSQL...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const promocionesDB = await prisma.portalPromocion.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📋 Promociones en PostgreSQL: ${promocionesDB.length}`);
    promocionesDB.forEach((p, i) => {
      console.log(`  ${i + 1}. "${p.title}" (activo: ${p.active}, orden: ${p.orden})`);
      console.log(`      ID: ${p.id}`);
      console.log(`      Descuento: ${p.discount}`);
      console.log(`      Descripción: ${p.description || 'sin descripción'}`);
      console.log(`      Creado: ${p.createdAt.toISOString()}`);
      console.log('');
    });
    
    // 2. Verificar endpoint del cliente
    console.log('\n🔍 2. Endpoint del cliente (/api/portal/config-v2)...');
    const clientResponse = await fetch(`http://localhost:3001/api/portal/config-v2?businessId=${businessId}`);
    
    if (!clientResponse.ok) {
      console.error(`❌ Cliente endpoint falló: ${clientResponse.status}`);
      const errorText = await clientResponse.text();
      console.error('Error:', errorText);
      return;
    }
    
    const clientData = await clientResponse.json();
    console.log(`📋 Promociones en cliente: ${clientData.promotions?.length || 0}`);
    
    if (clientData.promotions && clientData.promotions.length > 0) {
      clientData.promotions.forEach((p, i) => {
        console.log(`  ${i + 1}. "${p.title}" (activo: ${p.isActive}, descuento: ${p.discount})`);
      });
    } else {
      console.log('❌ No hay promociones en la respuesta del cliente');
      console.log('📋 Estructura de respuesta del cliente:');
      console.log('Keys:', Object.keys(clientData));
    }
    
    // 3. Verificar filtros que podrían estar excluyendo promociones
    console.log('\n🔍 3. Verificando filtros...');
    
    const promocionesConFiltro = await prisma.portalPromocion.findMany({
      where: {
        businessId,
        active: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      orderBy: { orden: 'asc' }
    });
    
    console.log(`📋 Promociones que pasan el filtro: ${promocionesConFiltro.length}`);
    promocionesConFiltro.forEach((p, i) => {
      console.log(`  ${i + 1}. "${p.title}" (validUntil: ${p.validUntil || 'null'})`);
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

diagnosticoCompleto();
