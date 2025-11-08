const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script para crear menú completo de demo
 * Categorías: Platos, Postres, Bebidas, Botellas
 */

async function crearMenuDemo() {
  try {
    console.log('🍽️ Iniciando creación de menú demo...\n');

    // Buscar el negocio "Demo Lealta"
    const demoBusiness = await prisma.business.findFirst({
      where: {
        name: {
          contains: 'Demo',
        },
      },
    });

    if (!demoBusiness) {
      console.log('❌ No se encontró el negocio Demo');
      console.log('Por favor crea primero el negocio con el otro script');
      return;
    }

    console.log(`✅ Negocio encontrado: ${demoBusiness.name} (${demoBusiness.id})\n`);

    // ============================================
    // 1. CATEGORÍA: ENTRADAS Y PIQUEOS
    // ============================================
    console.log('📋 Creando categoría: Entradas y Piqueos...');
    const catEntradas = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Entradas y Piqueos',
        descripcion: 'Para compartir y abrir el apetito',
        orden: 1,
        activo: true,
      },
    });

    const productosEntradas = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: catEntradas.id,
          nombre: 'Alitas BBQ',
          descripcion: '10 unidades con salsa BBQ casera',
          precio: 12.50,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 1,
        },
        {
          categoryId: catEntradas.id,
          nombre: 'Nachos Supreme',
          descripcion: 'Chips de maíz con queso, guacamole y jalapeños',
          precio: 9.90,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 2,
        },
        {
          categoryId: catEntradas.id,
          nombre: 'Tequeños',
          descripcion: '8 unidades de queso',
          precio: 8.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 3,
        },
        {
          categoryId: catEntradas.id,
          nombre: 'Calamares Fritos',
          descripcion: 'Anillos de calamar con salsa tártara',
          precio: 14.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 4,
        },
        {
          categoryId: catEntradas.id,
          nombre: 'Patacones con Ceviche',
          descripcion: 'Plátano verde frito con ceviche de pescado',
          precio: 11.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 5,
        },
      ],
    });

    console.log(`✅ ${productosEntradas.count} productos de Entradas creados\n`);

    // ============================================
    // 2. CATEGORÍA: PLATOS FUERTES
    // ============================================
    console.log('📋 Creando categoría: Platos Fuertes...');
    const catPlatos = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Platos Fuertes',
        descripcion: 'Nuestras especialidades de la casa',
        orden: 2,
        activo: true,
      },
    });

    const productosPlatos = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: catPlatos.id,
          nombre: 'Hamburguesa Clásica',
          descripcion: 'Carne 200g, queso, lechuga, tomate, papas fritas',
          precio: 15.90,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 1,
        },
        {
          categoryId: catPlatos.id,
          nombre: 'Costillas BBQ',
          descripcion: '500g de costillas con salsa BBQ, ensalada y papas',
          precio: 22.90,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 2,
        },
        {
          categoryId: catPlatos.id,
          nombre: 'Lomo Saltado',
          descripcion: 'Carne de res salteada, papas fritas, arroz',
          precio: 18.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 3,
        },
        {
          categoryId: catPlatos.id,
          nombre: 'Seco de Chivo',
          descripcion: 'Estofado tradicional con arroz y menestra',
          precio: 16.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 4,
        },
        {
          categoryId: catPlatos.id,
          nombre: 'Encocado de Camarón',
          descripcion: 'Camarones en salsa de coco, arroz con coco',
          precio: 19.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 5,
        },
        {
          categoryId: catPlatos.id,
          nombre: 'Pizza Margherita',
          descripcion: 'Salsa de tomate, mozzarella fresca, albahaca',
          precio: 13.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 6,
        },
        {
          categoryId: catPlatos.id,
          nombre: 'Pasta Alfredo con Pollo',
          descripcion: 'Fettuccine en salsa cremosa con pollo grillado',
          precio: 14.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 7,
        },
      ],
    });

    console.log(`✅ ${productosPlatos.count} Platos Fuertes creados\n`);

    // ============================================
    // 3. CATEGORÍA: POSTRES
    // ============================================
    console.log('📋 Creando categoría: Postres...');
    const catPostres = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Postres',
        descripcion: 'El toque dulce perfecto',
        orden: 3,
        activo: true,
      },
    });

    const productosPostres = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: catPostres.id,
          nombre: 'Cheesecake de Fresa',
          descripcion: 'Base de galleta, queso crema y coulis de fresa',
          precio: 6.50,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 1,
        },
        {
          categoryId: catPostres.id,
          nombre: 'Brownie con Helado',
          descripcion: 'Brownie de chocolate caliente con helado de vainilla',
          precio: 5.90,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 2,
        },
        {
          categoryId: catPostres.id,
          nombre: 'Tiramisu',
          descripcion: 'Clásico postre italiano con café y mascarpone',
          precio: 7.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 3,
        },
        {
          categoryId: catPostres.id,
          nombre: 'Tres Leches',
          descripcion: 'Bizcocho empapado en tres tipos de leche',
          precio: 5.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 4,
        },
        {
          categoryId: catPostres.id,
          nombre: 'Volcán de Chocolate',
          descripcion: 'Bizcocho con centro líquido de chocolate',
          precio: 6.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 5,
        },
      ],
    });

    console.log(`✅ ${productosPostres.count} Postres creados\n`);

    // ============================================
    // 4. CATEGORÍA: BEBIDAS SIN ALCOHOL
    // ============================================
    console.log('📋 Creando categoría: Bebidas sin Alcohol...');
    const catBebidasSin = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Bebidas sin Alcohol',
        descripcion: 'Refrescantes y naturales',
        orden: 4,
        activo: true,
      },
    });

    const productosBebidasSin = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: catBebidasSin.id,
          nombre: 'Coca Cola',
          descripcion: 'Lata 350ml',
          precio: 2.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 1,
        },
        {
          categoryId: catBebidasSin.id,
          nombre: 'Sprite',
          descripcion: 'Lata 350ml',
          precio: 2.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 2,
        },
        {
          categoryId: catBebidasSin.id,
          nombre: 'Agua Mineral',
          descripcion: 'Botella 500ml',
          precio: 1.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 3,
        },
        {
          categoryId: catBebidasSin.id,
          nombre: 'Limonada Natural',
          descripcion: 'Jugo de limón recién exprimido',
          precio: 3.50,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 4,
        },
        {
          categoryId: catBebidasSin.id,
          nombre: 'Jugo Natural Naranja',
          descripcion: 'Jugo de naranja recién exprimido',
          precio: 3.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 5,
        },
        {
          categoryId: catBebidasSin.id,
          nombre: 'Batido de Fresa',
          descripcion: 'Con leche y fresas naturales',
          precio: 4.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 6,
        },
        {
          categoryId: catBebidasSin.id,
          nombre: 'Té Helado',
          descripcion: 'Durazno o limón',
          precio: 2.90,
          tipoProducto: 'simple',
          disponible: true,
          orden: 7,
        },
      ],
    });

    console.log(`✅ ${productosBebidasSin.count} Bebidas sin Alcohol creadas\n`);

    // ============================================
    // 5. CATEGORÍA: CÓCTELES
    // ============================================
    console.log('📋 Creando categoría: Cócteles...');
    const catCocteles = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Cócteles',
        descripcion: 'Preparados por nuestros bartenders',
        orden: 5,
        activo: true,
      },
    });

    const productosCocteles = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: catCocteles.id,
          nombre: 'Mojito Clásico',
          descripcion: 'Ron, hierbabuena, limón, azúcar, soda',
          precio: 8.50,
          tipoProducto: 'bebida',
          disponible: true,
          destacado: true,
          orden: 1,
        },
        {
          categoryId: catCocteles.id,
          nombre: 'Piña Colada',
          descripcion: 'Ron, crema de coco, jugo de piña',
          precio: 9.50,
          tipoProducto: 'bebida',
          disponible: true,
          destacado: true,
          orden: 2,
        },
        {
          categoryId: catCocteles.id,
          nombre: 'Margarita',
          descripcion: 'Tequila, triple sec, limón',
          precio: 9.90,
          tipoProducto: 'bebida',
          disponible: true,
          orden: 3,
        },
        {
          categoryId: catCocteles.id,
          nombre: 'Caipirinha',
          descripcion: 'Cachaça, limón, azúcar',
          precio: 8.90,
          tipoProducto: 'bebida',
          disponible: true,
          orden: 4,
        },
        {
          categoryId: catCocteles.id,
          nombre: 'Cuba Libre',
          descripcion: 'Ron, coca cola, limón',
          precio: 7.50,
          tipoProducto: 'bebida',
          disponible: true,
          orden: 5,
        },
        {
          categoryId: catCocteles.id,
          nombre: 'Sex on the Beach',
          descripcion: 'Vodka, melocotón, arándano, naranja',
          precio: 9.90,
          tipoProducto: 'bebida',
          disponible: true,
          orden: 6,
        },
        {
          categoryId: catCocteles.id,
          nombre: 'Daiquiri de Fresa',
          descripcion: 'Ron, fresas, limón, azúcar',
          precio: 9.50,
          tipoProducto: 'bebida',
          disponible: true,
          orden: 7,
        },
        {
          categoryId: catCocteles.id,
          nombre: 'Cosmopolitan',
          descripcion: 'Vodka, triple sec, arándano, limón',
          precio: 10.50,
          tipoProducto: 'bebida',
          disponible: true,
          orden: 8,
        },
      ],
    });

    console.log(`✅ ${productosCocteles.count} Cócteles creados\n`);

    // ============================================
    // 6. CATEGORÍA: CERVEZAS
    // ============================================
    console.log('📋 Creando categoría: Cervezas...');
    const catCervezas = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Cervezas',
        descripcion: 'Nacionales e importadas',
        orden: 6,
        activo: true,
      },
    });

    const productosCervezas = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: catCervezas.id,
          nombre: 'Pilsener',
          descripcion: 'Botella 330ml',
          precio: 3.50,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 1,
        },
        {
          categoryId: catCervezas.id,
          nombre: 'Club',
          descripcion: 'Botella 330ml',
          precio: 3.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 2,
        },
        {
          categoryId: catCervezas.id,
          nombre: 'Heineken',
          descripcion: 'Botella 330ml',
          precio: 5.50,
          tipoProducto: 'simple',
          disponible: true,
          destacado: true,
          orden: 3,
        },
        {
          categoryId: catCervezas.id,
          nombre: 'Corona',
          descripcion: 'Botella 330ml',
          precio: 6.00,
          tipoProducto: 'simple',
          disponible: true,
          orden: 4,
        },
        {
          categoryId: catCervezas.id,
          nombre: 'Stella Artois',
          descripcion: 'Botella 330ml',
          precio: 6.50,
          tipoProducto: 'simple',
          disponible: true,
          orden: 5,
        },
        {
          categoryId: catCervezas.id,
          nombre: 'Budweiser',
          descripcion: 'Botella 330ml',
          precio: 5.00,
          tipoProducto: 'simple',
          disponible: true,
          orden: 6,
        },
      ],
    });

    console.log(`✅ ${productosCervezas.count} Cervezas creadas\n`);

    // ============================================
    // 7. CATEGORÍA: BOTELLAS Y LICORES
    // ============================================
    console.log('📋 Creando categoría: Botellas y Licores...');
    const catBotellas = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Botellas y Licores',
        descripcion: 'Servicio por vaso o botella completa',
        orden: 7,
        activo: true,
      },
    });

    const productosBotellas = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: catBotellas.id,
          nombre: 'Ron Bacardí Blanco',
          descripcion: '750ml',
          precioVaso: 6.50,
          precioBotella: 45.00,
          tipoProducto: 'botella',
          disponible: true,
          destacado: true,
          orden: 1,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Ron Zacapa 23',
          descripcion: '750ml - Premium',
          precioVaso: 12.00,
          precioBotella: 95.00,
          tipoProducto: 'botella',
          disponible: true,
          destacado: true,
          orden: 2,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Vodka Absolut',
          descripcion: '750ml',
          precioVaso: 7.00,
          precioBotella: 48.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 3,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Vodka Grey Goose',
          descripcion: '750ml - Premium',
          precioVaso: 10.00,
          precioBotella: 75.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 4,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Whisky Jack Daniels',
          descripcion: '750ml',
          precioVaso: 9.00,
          precioBotella: 65.00,
          tipoProducto: 'botella',
          disponible: true,
          destacado: true,
          orden: 5,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Whisky Johnnie Walker Black',
          descripcion: '750ml',
          precioVaso: 11.00,
          precioBotella: 80.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 6,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Tequila José Cuervo',
          descripcion: '750ml',
          precioVaso: 7.50,
          precioBotella: 52.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 7,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Tequila Patrón Silver',
          descripcion: '750ml - Premium',
          precioVaso: 13.00,
          precioBotella: 105.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 8,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Gin Bombay Sapphire',
          descripcion: '750ml',
          precioVaso: 8.50,
          precioBotella: 60.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 9,
        },
        {
          categoryId: catBotellas.id,
          nombre: 'Pisco Tres Generaciones',
          descripcion: '750ml',
          precioVaso: 6.00,
          precioBotella: 42.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 10,
        },
      ],
    });

    console.log(`✅ ${productosBotellas.count} Botellas y Licores creadas\n`);

    // ============================================
    // 8. CATEGORÍA: VINOS
    // ============================================
    console.log('📋 Creando categoría: Vinos...');
    const catVinos = await prisma.menuCategory.create({
      data: {
        businessId: demoBusiness.id,
        nombre: 'Vinos',
        descripcion: 'Selección de vinos tintos y blancos',
        orden: 8,
        activo: true,
      },
    });

    const productosVinos = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: catVinos.id,
          nombre: 'Vino Tinto Casillero del Diablo',
          descripcion: 'Copa o botella 750ml - Cabernet Sauvignon',
          precioVaso: 6.50,
          precioBotella: 35.00,
          tipoProducto: 'botella',
          disponible: true,
          destacado: true,
          orden: 1,
        },
        {
          categoryId: catVinos.id,
          nombre: 'Vino Blanco Santa Rita',
          descripcion: 'Copa o botella 750ml - Sauvignon Blanc',
          precioVaso: 6.00,
          precioBotella: 32.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 2,
        },
        {
          categoryId: catVinos.id,
          nombre: 'Vino Rosé Mateus',
          descripcion: 'Copa o botella 750ml',
          precioVaso: 5.50,
          precioBotella: 28.00,
          tipoProducto: 'botella',
          disponible: true,
          orden: 3,
        },
        {
          categoryId: catVinos.id,
          nombre: 'Prosecco Riccadonna',
          descripcion: 'Botella 750ml - Espumante',
          precioVaso: 7.50,
          precioBotella: 42.00,
          tipoProducto: 'botella',
          disponible: true,
          destacado: true,
          orden: 4,
        },
      ],
    });

    console.log(`✅ ${productosVinos.count} Vinos creados\n`);

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('═══════════════════════════════════════');
    console.log('✅ MENÚ DEMO CREADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════');
    console.log(`\n📊 RESUMEN:`);
    console.log(`- Business: ${demoBusiness.name}`);
    console.log(`- Total de categorías: 8`);
    console.log(`  1. Entradas y Piqueos (5 productos)`);
    console.log(`  2. Platos Fuertes (7 productos)`);
    console.log(`  3. Postres (5 productos)`);
    console.log(`  4. Bebidas sin Alcohol (7 productos)`);
    console.log(`  5. Cócteles (8 productos)`);
    console.log(`  6. Cervezas (6 productos)`);
    console.log(`  7. Botellas y Licores (10 productos)`);
    console.log(`  8. Vinos (4 productos)`);
    console.log(`\n📝 Total de productos: 52`);
    console.log(`\n🎉 ¡Todo listo para generar consumos realistas!`);

  } catch (error) {
    console.error('❌ Error creando menú:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
crearMenuDemo()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  });
