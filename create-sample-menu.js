const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createSampleData() {
  try {
    // Crear categorías de ejemplo
    const bebidas = await prisma.menuCategory.create({
      data: {
        businessId: 'business_1',
        nombre: 'Bebidas',
        descripcion: 'Refrescantes bebidas y cocteles',
        icono: '🥤',
        orden: 1
      }
    });

    const comidas = await prisma.menuCategory.create({
      data: {
        businessId: 'business_1', 
        nombre: 'Comidas',
        descripcion: 'Deliciosos platos principales',
        icono: '🍽️',
        orden: 2
      }
    });

    const postres = await prisma.menuCategory.create({
      data: {
        businessId: 'business_1',
        nombre: 'Postres',
        descripcion: 'Dulces tentaciones',
        icono: '🍰',
        orden: 3
      }
    });

    // Crear productos de bebidas
    await prisma.menuProduct.create({
      data: {
        categoryId: bebidas.id,
        nombre: 'Mojito Clásico',
        descripcion: 'Ron blanco, menta, lima y azúcar',
        precio: 15000,
        tipoProducto: 'simple',
        disponible: true,
        destacado: true,
        orden: 1,
        imagenUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400'
      }
    });

    await prisma.menuProduct.create({
      data: {
        categoryId: bebidas.id,
        nombre: 'Whisky Premium',
        descripcion: 'Whisky escocés de 12 años',
        precioVaso: 25000,
        precioBotella: 180000,
        tipoProducto: 'botella',
        disponible: true,
        orden: 2,
        imagenUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400'
      }
    });

    // Crear productos de comida
    await prisma.menuProduct.create({
      data: {
        categoryId: comidas.id,
        nombre: 'Hamburguesa Gourmet',
        descripcion: 'Carne angus, queso brie, cebolla caramelizada',
        precio: 28000,
        tipoProducto: 'simple',
        disponible: true,
        destacado: true,
        orden: 1,
        imagenUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
      }
    });

    // Crear postres
    await prisma.menuProduct.create({
      data: {
        categoryId: postres.id,
        nombre: 'Tiramisú',
        descripcion: 'Clásico postre italiano con mascarpone',
        precio: 12000,
        tipoProducto: 'simple',
        disponible: true,
        orden: 1,
        imagenUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'
      }
    });

    console.log('✅ Datos de ejemplo creados exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
