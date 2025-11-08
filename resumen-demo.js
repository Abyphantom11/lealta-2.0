const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findFirst({
    where: { name: { contains: 'Demo' } }
  });

  if (!business) {
    console.log('No se encontro negocio Demo');
    return;
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     RESUMEN COMPLETO: ' + business.name.padEnd(30) + '║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // MENU
  const categorias = await prisma.menuCategory.count({
    where: { businessId: business.id }
  });
  const productos = await prisma.menuProduct.count({
    where: { MenuCategory: { businessId: business.id } }
  });

  console.log('📋 MENU');
  console.log('   ├─ Categorias: ' + categorias);
  console.log('   └─ Productos: ' + productos + '\n');

  // CLIENTES
  const clientes = await prisma.cliente.findMany({
    where: { businessId: business.id },
    select: { puntos: true, totalGastado: true }
  });

  const niveles = {
    platino: clientes.filter(c => c.puntos >= 1000).length,
    diamante: clientes.filter(c => c.puntos >= 500 && c.puntos < 1000).length,
    oro: clientes.filter(c => c.puntos >= 250 && c.puntos < 500).length,
    plata: clientes.filter(c => c.puntos >= 100 && c.puntos < 250).length,
    bronce: clientes.filter(c => c.puntos < 100).length
  };

  const totalPuntos = clientes.reduce((sum, c) => sum + c.puntos, 0);
  const totalGastado = clientes.reduce((sum, c) => sum + c.totalGastado, 0);

  console.log('👥 CLIENTES');
  console.log('   ├─ Total: ' + clientes.length);
  console.log('   ├─ Niveles:');
  console.log('   │  ├─ 💎 Platino: ' + niveles.platino);
  console.log('   │  ├─ 💠 Diamante: ' + niveles.diamante);
  console.log('   │  ├─ ⭐ Oro: ' + niveles.oro);
  console.log('   │  ├─ 🥈 Plata: ' + niveles.plata);
  console.log('   │  └─ 🥉 Bronce: ' + niveles.bronce);
  console.log('   ├─ Puntos totales: ' + totalPuntos.toLocaleString());
  console.log('   └─ Gasto total: $' + totalGastado.toFixed(2) + '\n');

  // CONSUMOS
  const consumos = await prisma.consumo.aggregate({
    where: { businessId: business.id },
    _count: true,
    _sum: { total: true, puntos: true },
    _avg: { total: true }
  });

  console.log('🛒 CONSUMOS');
  console.log('   ├─ Total transacciones: ' + consumos._count);
  console.log('   ├─ Ventas totales: $' + (consumos._sum.total || 0).toFixed(2));
  console.log('   ├─ Ticket promedio: $' + (consumos._avg.total || 0).toFixed(2));
  console.log('   └─ Puntos otorgados: ' + (consumos._sum.puntos || 0).toLocaleString() + '\n');

  // RECOMPENSAS
  const recompensas = await prisma.portalRecompensa.groupBy({
    by: ['category'],
    where: { businessId: business.id, active: true },
    _count: true
  });

  const totalRecompensas = recompensas.reduce((sum, r) => sum + r._count, 0);

  console.log('🎁 RECOMPENSAS');
  console.log('   ├─ Total activas: ' + totalRecompensas);
  recompensas.forEach((r, i) => {
    const isLast = i === recompensas.length - 1;
    console.log('   ' + (isLast ? '└─' : '├─') + ' ' + (r.category || 'Sin categoria') + ': ' + r._count);
  });
  console.log('');

  // PROMOCIONES
  const promocionesActivas = await prisma.portalPromocion.count({
    where: { businessId: business.id, active: true }
  });

  const promocionesPorDia = await prisma.portalPromocion.groupBy({
    by: ['dia'],
    where: { businessId: business.id, active: true },
    _count: true
  });

  console.log('🎉 PROMOCIONES');
  console.log('   ├─ Total activas: ' + promocionesActivas);
  console.log('   └─ Distribucion:');
  promocionesPorDia.forEach((p, i) => {
    const isLast = i === promocionesPorDia.length - 1;
    const dia = p.dia || 'Permanente';
    console.log('      ' + (isLast ? '└─' : '├─') + ' ' + dia + ': ' + p._count);
  });
  console.log('');

  // METRICAS CLAVE
  const promedioVisitasPorCliente = clientes.length > 0 
    ? (consumos._count / clientes.length).toFixed(1) 
    : 0;
  
  const tasaRetencion = clientes.length > 0
    ? ((clientes.filter(c => c.puntos >= 100).length / clientes.length) * 100).toFixed(1)
    : 0;

  console.log('📊 METRICAS CLAVE');
  console.log('   ├─ Promedio visitas/cliente: ' + promedioVisitasPorCliente);
  console.log('   ├─ Tasa de retencion: ' + tasaRetencion + '%');
  console.log('   ├─ Valor promedio cliente: $' + (totalGastado / clientes.length).toFixed(2));
  console.log('   └─ Conversion a puntos: ' + ((consumos._sum.puntos || 0) / (consumos._sum.total || 1)).toFixed(2) + ' pts/$\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ NEGOCIO DEMO 100% CONFIGURADO');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n💡 Todo listo para demostracion y presentaciones!\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e.message); prisma.$disconnect(); });
