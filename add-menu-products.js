const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMenuProducts() {
  try {
    // Buscar el business de demo (casasabordemo) - SOLO por subdomain
    const business = await prisma.business.findFirst({
      where: {
        subdomain: 'casasabordemo',
      },
    });

    if (!business) {
      console.error('❌ Business demo no encontrado');
      return;
    }

    console.log('✅ Business encontrado:', business.name, '(ID:', business.id, ')');

    // 1. Crear categorías principales
    console.log('\n📂 Creando categorías...');

    // Buscar o crear categoría Entradas
    let categoriaEntradas = await prisma.menuCategory.findFirst({
      where: {
        businessId: business.id,
        nombre: 'Entradas',
        parentId: null,
      },
    });

    if (!categoriaEntradas) {
      categoriaEntradas = await prisma.menuCategory.create({
        data: {
          businessId: business.id,
          nombre: 'Entradas',
          descripcion: 'Deliciosas entradas para comenzar',
          orden: 1,
          activo: true,
          icono: '🍽️',
        },
      });
    }
    console.log('✅ Categoría: Entradas');

    // Buscar o crear categoría Platillos Principales
    let categoriaPlatillos = await prisma.menuCategory.findFirst({
      where: {
        businessId: business.id,
        nombre: 'Platillos Principales',
        parentId: null,
      },
    });

    if (!categoriaPlatillos) {
      categoriaPlatillos = await prisma.menuCategory.create({
        data: {
          businessId: business.id,
          nombre: 'Platillos Principales',
          descripcion: 'Nuestros mejores platillos',
          orden: 2,
          activo: true,
          icono: '🍖',
        },
      });
    }
    console.log('✅ Categoría: Platillos Principales');

    // Buscar o crear categoría Bebidas
    let categoriaBebidas = await prisma.menuCategory.findFirst({
      where: {
        businessId: business.id,
        nombre: 'Bebidas',
        parentId: null,
      },
    });

    if (!categoriaBebidas) {
      categoriaBebidas = await prisma.menuCategory.create({
        data: {
          businessId: business.id,
          nombre: 'Bebidas',
          descripcion: 'Bebidas refrescantes y cócteles',
          orden: 3,
          activo: true,
          icono: '🍹',
        },
      });
    }
    console.log('✅ Categoría: Bebidas');

    // Buscar o crear categoría Postres
    let categoriaPostres = await prisma.menuCategory.findFirst({
      where: {
        businessId: business.id,
        nombre: 'Postres',
        parentId: null,
      },
    });

    if (!categoriaPostres) {
      categoriaPostres = await prisma.menuCategory.create({
        data: {
          businessId: business.id,
          nombre: 'Postres',
          descripcion: 'Dulces delicias para cerrar con broche de oro',
          orden: 4,
          activo: true,
          icono: '🍰',
        },
      });
    }
    console.log('✅ Categoría: Postres');

    // 2. Crear productos para Entradas
    console.log('\n🍽️ Agregando Entradas...');

    const entradasProducts = [
      {
        nombre: 'Tabla de Quesos y Embutidos',
        descripcion: 'Selección de quesos artesanales y embutidos premium, acompañados de mermeladas y pan tostado',
        precio: 18.99,
        disponible: true,
        destacado: true,
        orden: 1,
      },
      {
        nombre: 'Calamares a la Romana',
        descripcion: 'Anillos de calamar rebozados, crujientes por fuera y tiernos por dentro, con salsa tártara',
        precio: 12.50,
        disponible: true,
        destacado: false,
        orden: 2,
      },
      {
        nombre: 'Croquetas de Jamón Ibérico',
        descripcion: '6 unidades de croquetas caseras con jamón ibérico de bellota',
        precio: 10.99,
        disponible: true,
        destacado: true,
        orden: 3,
      },
      {
        nombre: 'Ensalada César',
        descripcion: 'Lechuga romana, crutones, queso parmesano, pollo grillé y aderezo César casero',
        precio: 9.99,
        disponible: true,
        destacado: false,
        orden: 4,
      },
    ];

    for (const product of entradasProducts) {
      await prisma.menuProduct.upsert({
        where: {
          categoryId_nombre: {
            categoryId: categoriaEntradas.id,
            nombre: product.nombre,
          },
        },
        update: {},
        create: {
          categoryId: categoriaEntradas.id,
          ...product,
        },
      });
      console.log('  ✅', product.nombre);
    }

    // 3. Crear productos para Platillos Principales
    console.log('\n🍖 Agregando Platillos Principales...');

    const platillosProducts = [
      {
        nombre: 'Filete Mignon a la Parrilla',
        descripcion: '250g de solomillo de res premium, con puré de papa trufado y espárragos',
        precio: 32.99,
        disponible: true,
        destacado: true,
        orden: 1,
      },
      {
        nombre: 'Salmón a la Plancha',
        descripcion: 'Filete de salmón fresco con risotto de limón y verduras asadas',
        precio: 24.99,
        disponible: true,
        destacado: true,
        orden: 2,
      },
      {
        nombre: 'Pasta Carbonara',
        descripcion: 'Fettuccine con salsa carbonara tradicional, panceta y queso parmesano',
        precio: 16.99,
        disponible: true,
        destacado: false,
        orden: 3,
      },
      {
        nombre: 'Pollo al Curry',
        descripcion: 'Pechuga de pollo en salsa de curry tailandés con arroz jazmín y vegetales',
        precio: 18.50,
        disponible: true,
        destacado: false,
        orden: 4,
      },
      {
        nombre: 'Lasagna Boloñesa',
        descripcion: 'Lasagna casera con ragú de carne, bechamel y queso gratinado',
        precio: 15.99,
        disponible: true,
        destacado: false,
        orden: 5,
      },
      {
        nombre: 'Paella Valenciana',
        descripcion: 'Arroz con mariscos, pollo, conejo y azafrán (para 2 personas)',
        precio: 38.99,
        disponible: true,
        destacado: true,
        orden: 6,
      },
    ];

    for (const product of platillosProducts) {
      await prisma.menuProduct.upsert({
        where: {
          categoryId_nombre: {
            categoryId: categoriaPlatillos.id,
            nombre: product.nombre,
          },
        },
        update: {},
        create: {
          categoryId: categoriaPlatillos.id,
          ...product,
        },
      });
      console.log('  ✅', product.nombre);
    }

    // 4. Crear productos para Bebidas
    console.log('\n🍹 Agregando Bebidas...');

    const bebidasProducts = [
      {
        nombre: 'Mojito Clásico',
        descripcion: 'Ron blanco, hierbabuena, limón, azúcar y soda',
        precio: 8.99,
        disponible: true,
        destacado: true,
        orden: 1,
      },
      {
        nombre: 'Margarita',
        descripcion: 'Tequila, triple sec, jugo de limón y sal',
        precio: 9.50,
        disponible: true,
        destacado: true,
        orden: 2,
      },
      {
        nombre: 'Piña Colada',
        descripcion: 'Ron, crema de coco, jugo de piña',
        precio: 8.50,
        disponible: true,
        destacado: false,
        orden: 3,
      },
      {
        nombre: 'Cerveza Artesanal IPA',
        descripcion: 'Cerveza artesanal local, 500ml',
        precio: 5.99,
        disponible: true,
        destacado: false,
        orden: 4,
      },
      {
        nombre: 'Limonada Natural',
        descripcion: 'Limonada recién exprimida con hierbabuena',
        precio: 3.99,
        disponible: true,
        destacado: false,
        orden: 5,
      },
      {
        nombre: 'Sangría de la Casa',
        descripcion: 'Vino tinto, frutas frescas y brandy (jarra 1L)',
        precio: 16.99,
        disponible: true,
        destacado: true,
        orden: 6,
      },
    ];

    for (const product of bebidasProducts) {
      await prisma.menuProduct.upsert({
        where: {
          categoryId_nombre: {
            categoryId: categoriaBebidas.id,
            nombre: product.nombre,
          },
        },
        update: {},
        create: {
          categoryId: categoriaBebidas.id,
          ...product,
        },
      });
      console.log('  ✅', product.nombre);
    }

    // 5. Crear productos para Postres
    console.log('\n🍰 Agregando Postres...');

    const postresProducts = [
      {
        nombre: 'Tiramisu',
        descripcion: 'Clásico postre italiano con café, mascarpone y cacao',
        precio: 7.99,
        disponible: true,
        destacado: true,
        orden: 1,
      },
      {
        nombre: 'Cheesecake de Frutos Rojos',
        descripcion: 'Tarta de queso cremosa con coulis de frutos rojos',
        precio: 8.50,
        disponible: true,
        destacado: true,
        orden: 2,
      },
      {
        nombre: 'Brownie con Helado',
        descripcion: 'Brownie de chocolate caliente con helado de vainilla',
        precio: 6.99,
        disponible: true,
        destacado: false,
        orden: 3,
      },
      {
        nombre: 'Flan de Caramelo',
        descripcion: 'Flan casero con caramelo líquido',
        precio: 5.99,
        disponible: true,
        destacado: false,
        orden: 4,
      },
      {
        nombre: 'Crème Brûlée',
        descripcion: 'Crema francesa con costra de azúcar caramelizada',
        precio: 7.50,
        disponible: true,
        destacado: false,
        orden: 5,
      },
    ];

    for (const product of postresProducts) {
      await prisma.menuProduct.upsert({
        where: {
          categoryId_nombre: {
            categoryId: categoriaPostres.id,
            nombre: product.nombre,
          },
        },
        update: {},
        create: {
          categoryId: categoriaPostres.id,
          ...product,
        },
      });
      console.log('  ✅', product.nombre);
    }

    // Resumen final
    console.log('\n📊 Resumen:');
    const totalCategorias = await prisma.menuCategory.count({
      where: { businessId: business.id },
    });
    const totalProductos = await prisma.menuProduct.count({
      where: {
        category: {
          businessId: business.id,
        },
      },
    });

    console.log(`✅ Total Categorías: ${totalCategorias}`);
    console.log(`✅ Total Productos: ${totalProductos}`);
    console.log('\n🎉 ¡Menú poblado exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMenuProducts();
