const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const business = await prisma.business.findUnique({
    where: { id: 'cmgf5px5f0000eyy0elci9yds' },
    include: {
      MenuCategory: true,
      Cliente: true,
      Consumo: true,
      PortalRecompensa: true,
      PortalPromocion: true,
      Location: true,
      User: true
    }
  });
  
  const reservas = await prisma.reservation.count({
    where: { businessId: business.id }
  });
  
  const productos = await prisma.menuProduct.count({
    where: { MenuCategory: { businessId: business.id } }
  });
  
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  NEGOCIO:', business.name.padEnd(40), '║');
  console.log('╚════════════════════════════════════════════════════╝\n');
  console.log('📍 Slug:', business.slug);
  console.log('�� Subdominio:', business.subdomain);
  console.log('🆔 ID:', business.id, '\n');
  console.log('📊 CONTENIDO:');
  console.log('   ├─ Categorías de menú:', business.MenuCategory.length);
  console.log('   ├─ Productos:', productos);
  console.log('   ├─ Clientes:', business.Cliente.length);
  console.log('   ├─ Consumos:', business.Consumo.length);
  console.log('   ├─ Recompensas:', business.PortalRecompensa.length);
  console.log('   ├─ Promociones:', business.PortalPromocion.length);
  console.log('   ├─ Reservas:', reservas);
  console.log('   ├─ Locations:', business.Location.length);
  console.log('   └─ Usuarios:', business.User.length);
}

check().then(() => prisma.$disconnect());
