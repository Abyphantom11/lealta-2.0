const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🎁 Creando recompensas y promociones...\n');

  const business = await prisma.business.findFirst({
    where: { name: { contains: 'Demo' } }
  });

  if (!business) {
    console.log('❌ No se encontro negocio Demo');
    return;
  }

  console.log('✅ Negocio:', business.name, '\n');

  // =====================================================
  // RECOMPENSAS (Catálogo de canje de puntos)
  // =====================================================
  console.log('🎁 Creando recompensas...');

  const recompensas = await prisma.portalRecompensa.createMany({
    data: [
      // BEBIDAS Y POSTRES (50-150 puntos)
      {
        businessId: business.id,
        title: 'Café Gratis',
        description: 'Cualquier café de nuestra carta',
        pointsCost: 50,
        category: 'Bebidas',
        active: true,
        orden: 1,
        unlimited: true
      },
      {
        businessId: business.id,
        title: 'Postre del Día',
        description: 'Postre especial seleccionado por el chef',
        pointsCost: 80,
        category: 'Postres',
        active: true,
        orden: 2,
        unlimited: true
      },
      {
        businessId: business.id,
        title: 'Cerveza Nacional',
        description: 'Pilsener o Club - 330ml',
        pointsCost: 100,
        category: 'Bebidas',
        active: true,
        orden: 3,
        unlimited: true
      },
      {
        businessId: business.id,
        title: 'Cóctel Clásico',
        description: 'Mojito, Cuba Libre o Daiquiri',
        pointsCost: 150,
        category: 'Bebidas',
        active: true,
        orden: 4,
        unlimited: true
      },

      // PLATOS Y ENTRADAS (200-400 puntos)
      {
        businessId: business.id,
        title: 'Entrada a Elección',
        description: 'Cualquier entrada de nuestra carta',
        pointsCost: 200,
        category: 'Comidas',
        active: true,
        orden: 5,
        unlimited: true
      },
      {
        businessId: business.id,
        title: 'Hamburguesa Completa',
        description: 'Hamburguesa con papas fritas y bebida',
        pointsCost: 300,
        category: 'Comidas',
        active: true,
        orden: 6,
        unlimited: true
      },
      {
        businessId: business.id,
        title: 'Plato del Día',
        description: 'Plato fuerte seleccionado + bebida',
        pointsCost: 350,
        category: 'Comidas',
        active: true,
        orden: 7,
        unlimited: true
      },

      // EXPERIENCIAS VIP (500-1000 puntos)
      {
        businessId: business.id,
        title: 'Cena para Dos',
        description: '2 platos fuertes + 2 bebidas + 1 postre para compartir',
        pointsCost: 500,
        category: 'Experiencias',
        active: true,
        orden: 8,
        stock: 10
      },
      {
        businessId: business.id,
        title: 'Botella Premium',
        description: 'Ron Zacapa 23 o Whisky Johnnie Walker Black',
        pointsCost: 800,
        category: 'Bebidas',
        active: true,
        orden: 9,
        stock: 5
      },
      {
        businessId: business.id,
        title: 'Experiencia Gourmet',
        description: 'Menú degustación completo para 2 personas',
        pointsCost: 1000,
        category: 'Experiencias',
        active: true,
        orden: 10,
        stock: 5
      },

      // DESCUENTOS (100-500 puntos)
      {
        businessId: business.id,
        title: '10% de Descuento',
        description: 'Aplica en tu próxima visita - Válido por 30 días',
        pointsCost: 100,
        category: 'Descuentos',
        active: true,
        orden: 11,
        unlimited: true
      },
      {
        businessId: business.id,
        title: '20% de Descuento',
        description: 'Aplica en tu próxima visita - Válido por 30 días',
        pointsCost: 200,
        category: 'Descuentos',
        active: true,
        orden: 12,
        unlimited: true
      },
      {
        businessId: business.id,
        title: '30% de Descuento VIP',
        description: 'Descuento especial para clientes leales - Válido por 30 días',
        pointsCost: 500,
        category: 'Descuentos',
        active: true,
        orden: 13,
        unlimited: true
      }
    ]
  });

  console.log(`   ✅ ${recompensas.count} recompensas creadas\n`);

  // =====================================================
  // PROMOCIONES (Ofertas activas)
  // =====================================================
  console.log('🎉 Creando promociones...');

  const hoy = new Date();
  const en30dias = new Date();
  en30dias.setDate(en30dias.getDate() + 30);
  const en60dias = new Date();
  en60dias.setDate(en60dias.getDate() + 60);

  const promociones = await prisma.portalPromocion.createMany({
    data: [
      // PROMOCIONES DIARIAS
      {
        businessId: business.id,
        title: '2x1 en Cervezas',
        description: 'Todos los lunes, martes y miércoles',
        discount: '50% OFF',
        dia: 'Lunes, Martes, Miércoles',
        active: true,
        orden: 1,
        validUntil: en60dias
      },
      {
        businessId: business.id,
        title: 'Happy Hour',
        description: 'Cócteles seleccionados a mitad de precio de 5pm a 8pm',
        discount: '50% OFF',
        dia: 'Todos los días',
        active: true,
        orden: 2,
        validUntil: en60dias
      },
      {
        businessId: business.id,
        title: 'Jueves de Alitas',
        description: 'Alitas BBQ + cerveza nacional por $10',
        discount: '$10',
        dia: 'Jueves',
        active: true,
        orden: 3,
        validUntil: en60dias
      },
      {
        businessId: business.id,
        title: 'Viernes de Botellas',
        description: '15% de descuento en botellas seleccionadas',
        discount: '15% OFF',
        dia: 'Viernes',
        active: true,
        orden: 4,
        validUntil: en60dias
      },

      // PROMOCIONES TEMPORALES
      {
        businessId: business.id,
        title: 'Lanzamiento de Menú',
        description: 'Prueba nuestros nuevos platos con 20% de descuento',
        discount: '20% OFF',
        active: true,
        orden: 5,
        validUntil: en30dias
      },
      {
        businessId: business.id,
        title: 'Combo Familiar',
        description: '2 platos fuertes + 4 bebidas + 2 postres por $45',
        discount: '$45',
        active: true,
        orden: 6,
        validUntil: en30dias
      },
      {
        businessId: business.id,
        title: 'Puntos Dobles',
        description: 'Gana el doble de puntos en todas tus compras este mes',
        discount: '2X PUNTOS',
        active: true,
        orden: 7,
        validUntil: en30dias
      },

      // PROMOCIONES ESPECIALES
      {
        businessId: business.id,
        title: 'Cumpleañeros',
        description: 'Postre gratis en tu cumpleaños + 50 puntos extra',
        discount: 'GRATIS',
        active: true,
        orden: 8,
        validUntil: en60dias
      },
      {
        businessId: business.id,
        title: 'Primera Visita',
        description: 'Registrate y recibe 100 puntos de bienvenida',
        discount: '100 PUNTOS',
        active: true,
        orden: 9,
        validUntil: en60dias
      },
      {
        businessId: business.id,
        title: 'Trae un Amigo',
        description: 'Tu y tu amigo reciben 50 puntos en su primera visita juntos',
        discount: '50 PUNTOS',
        active: true,
        orden: 10,
        validUntil: en60dias
      }
    ]
  });

  console.log(`   ✅ ${promociones.count} promociones creadas\n`);

  // =====================================================
  // RESUMEN
  // =====================================================
  console.log('═══════════════════════════════════════');
  console.log('✅ RECOMPENSAS Y PROMOCIONES CREADAS');
  console.log('═══════════════════════════════════════');
  console.log('\n📊 Resumen:');
  console.log(`   - Recompensas: ${recompensas.count}`);
  console.log(`     • Bebidas y Postres: 4`);
  console.log(`     • Comidas: 3`);
  console.log(`     • Experiencias VIP: 3`);
  console.log(`     • Descuentos: 3`);
  console.log(`   - Promociones: ${promociones.count}`);
  console.log(`     • Diarias: 4`);
  console.log(`     • Temporales: 3`);
  console.log(`     • Especiales: 3`);
  console.log('\n🎉 ¡Portal del cliente completo!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { 
    console.error('❌', e.message); 
    prisma.$disconnect(); 
    process.exit(1); 
  });
