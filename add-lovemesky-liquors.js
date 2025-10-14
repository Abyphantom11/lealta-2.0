#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LOVE_ME_SKY_ID = 'cmgh621rd0012lb0aixrzpvrw';

// Datos de licores premium con precios separados
const licoresData = {
  'TEQUILA': {
    descripcion: 'Selección premium de tequilas mexicanos, disponibles por botella y vaso.',
    productos: [
      { nombre: 'Don Julio Blanco', precioBotella: 145.00, precioVaso: 13.00, descripcion: 'Tequila blanco premium, cristalino y suave.' },
      { nombre: 'Don Julio Reposado', precioBotella: 155.00, precioVaso: 14.00, descripcion: 'Tequila reposado con notas de vainilla y caramelo.' },
      { nombre: 'Don Julio 70', precioBotella: 190.00, precioVaso: 16.50, descripcion: 'Añejo cristalino con proceso de filtrado único.' },
      { nombre: 'Don Julio 1942', precioBotella: 490.00, precioVaso: 42.00, descripcion: 'Tequila ultra premium, añejo excepcional.' },
      { nombre: 'Don Julio Rosado', precioBotella: 270.00, precioVaso: 23.00, descripcion: 'Reposado rosado terminado en barricas de vino.' },
      { nombre: 'Herradura Ultra', precioBotella: 175.00, precioVaso: 15.50, descripcion: 'Añejo cristalino ultra suave y refinado.' },
      { nombre: 'Herradura Reposado', precioBotella: 145.00, precioVaso: 13.00, descripcion: 'Reposado tradicional con carácter auténtico.' },
      { nombre: 'Herradura Ultra Añejo', precioBotella: 175.00, precioVaso: 15.50, descripcion: 'Añejo ultra premium con complejidad excepcional.' },
      { nombre: 'Patrón Silver', precioBotella: 170.00, precioVaso: 15.00, descripcion: 'Tequila plata ultra premium, puro y limpio.' },
      { nombre: 'Patrón Reposado', precioBotella: 175.00, precioVaso: 15.50, descripcion: 'Reposado premium con equilibrio perfecto.' },
      { nombre: '1800 Cristalino', precioBotella: 175.00, precioVaso: 15.50, descripcion: 'Añejo cristalino con pureza y elegancia.' },
      { nombre: 'Clase Azul', precioBotella: 680.00, precioVaso: 58.00, descripcion: 'Tequila ultra premium de lujo, edición especial.' }
    ]
  },
  'VODKA': {
    descripcion: 'Vodkas premium de las mejores destilerías del mundo, disponibles por botella y vaso.',
    productos: [
      { nombre: 'Absolut', precioBotella: 100.00, precioVaso: 9.00, descripcion: 'Vodka sueco clásico, puro y neutro.' },
      { nombre: 'Absolut Azul', precioBotella: 120.00, precioVaso: 11.00, descripcion: 'Vodka premium con carácter distintivo.' },
      { nombre: 'Absolut Extrakt', precioBotella: 120.00, precioVaso: 11.00, descripcion: 'Vodka con extractos naturales únicos.' },
      { nombre: 'Absolut Elyx', precioBotella: 175.00, precioVaso: 15.50, descripcion: 'Vodka luxury destilado en cobre vintage.' },
      { nombre: 'Stolichnaya', precioBotella: 100.00, precioVaso: 9.00, descripcion: 'Vodka ruso tradicional de calidad superior.' },
      { nombre: 'Grey Goose', precioBotella: 150.00, precioVaso: 13.00, descripcion: 'Vodka francés ultra premium, suave y refinado.' },
      { nombre: 'Ciroc', precioBotella: 170.00, precioVaso: 15.00, descripcion: 'Vodka francés destilado de uvas, único y elegante.' },
      { nombre: 'Belvedere', precioBotella: 150.00, precioVaso: 13.00, descripcion: 'Vodka polaco premium, puro y cristalino.' }
    ]
  },
  'GIN': {
    descripcion: 'Selección de gins premium con botánicos únicos, disponibles por botella y vaso.',
    productos: [
      { nombre: 'Tanqueray', precioBotella: 110.00, precioVaso: 10.00, descripcion: 'Gin londinense clásico con enebro prominente.' },
      { nombre: 'Tanqueray Ten', precioBotella: 145.00, precioVaso: 13.00, descripcion: 'Gin premium con cítricos frescos destilados.' },
      { nombre: 'Bombay Sapphire', precioBotella: 110.00, precioVaso: 10.00, descripcion: 'Gin con 10 botánicos exóticos balanceados.' },
      { nombre: 'Beefeater', precioBotella: 110.00, precioVaso: 10.00, descripcion: 'Gin londinense tradicional, seco y aromático.' },
      { nombre: 'Beefeater 24', precioBotella: 145.00, precioVaso: 13.00, descripcion: 'Gin premium con té japonés y pomelo.' },
      { nombre: 'Bulldog', precioBotella: 110.00, precioVaso: 10.00, descripcion: 'Gin inglés con botánicos orientales únicos.' },
      { nombre: 'Hendricks', precioBotella: 150.00, precioVaso: 13.00, descripcion: 'Gin escocés con pepino y pétalos de rosa.' }
    ]
  }
};

async function addPremiumLiquors() {
  try {
    console.log('🥃 Agregando licores premium a Love Me Sky...\n');

    // Verificar que el business existe
    const business = await prisma.business.findUnique({
      where: { id: LOVE_ME_SKY_ID }
    });

    if (!business) {
      console.error('❌ Business Love Me Sky no encontrado');
      return;
    }

    console.log(`✅ Business encontrado: ${business.name}`);

    // Obtener el orden actual más alto de las categorías existentes
    const lastCategory = await prisma.menuCategory.findFirst({
      where: { businessId: LOVE_ME_SKY_ID },
      orderBy: { orden: 'desc' }
    });

    let categoryOrder = lastCategory ? lastCategory.orden + 1 : 1;
    let totalProducts = 0;

    // Crear categorías y productos de licores premium
    for (const [categoryName, categoryData] of Object.entries(licoresData)) {
      console.log(`\n🥃 Creando categoría: ${categoryName}`);
      
      // Crear categoría
      const category = await prisma.menuCategory.create({
        data: {
          businessId: LOVE_ME_SKY_ID,
          nombre: categoryName,
          descripcion: categoryData.descripcion,
          orden: categoryOrder,
          activo: true
        }
      });

      console.log(`✅ Categoría "${categoryName}" creada con ID: ${category.id}`);

      // Crear productos para esta categoría
      let productOrder = 1;
      for (const product of categoryData.productos) {
        console.log(`   🍾 ${product.nombre}`);
        console.log(`      Botella: $${product.precioBotella} | Vaso: $${product.precioVaso}`);
        
        await prisma.menuProduct.create({
          data: {
            categoryId: category.id,
            nombre: product.nombre,
            descripcion: product.descripcion,
            precio: product.precioBotella, // Precio principal (botella)
            precioBotella: product.precioBotella,
            precioVaso: product.precioVaso,
            tipoProducto: 'botella', // Indica que es un producto con opciones de botella/vaso
            disponible: true,
            destacado: false,
            orden: productOrder
          }
        });

        productOrder++;
        totalProducts++;
      }

      console.log(`✅ ${categoryData.productos.length} licores agregados a ${categoryName}`);
      categoryOrder++;
    }

    console.log(`\n🎉 ¡Licores premium agregados exitosamente!`);
    console.log(`📊 Resumen:`);
    console.log(`   • ${Object.keys(licoresData).length} categorías de licores creadas`);
    console.log(`   • ${totalProducts} licores agregados`);
    
    // Mostrar resumen por categoría
    for (const [categoryName, categoryData] of Object.entries(licoresData)) {
      console.log(`   • ${categoryName}: ${categoryData.productos.length} productos`);
    }

    // Estadísticas de precios
    const allProducts = Object.values(licoresData).flatMap(cat => cat.productos);
    const bottlePrices = allProducts.map(p => p.precioBotella);
    const glassPrices = allProducts.map(p => p.precioVaso);

    console.log(`\n💰 Estadísticas de precios:`);
    console.log(`   📊 Botellas:`);
    console.log(`      • Mínimo: $${Math.min(...bottlePrices)}`);
    console.log(`      • Máximo: $${Math.max(...bottlePrices)}`);
    console.log(`      • Promedio: $${(bottlePrices.reduce((a, b) => a + b, 0) / bottlePrices.length).toFixed(2)}`);
    
    console.log(`   🥃 Vasos:`);
    console.log(`      • Mínimo: $${Math.min(...glassPrices)}`);
    console.log(`      • Máximo: $${Math.max(...glassPrices)}`);
    console.log(`      • Promedio: $${(glassPrices.reduce((a, b) => a + b, 0) / glassPrices.length).toFixed(2)}`);

    // Productos más premium por categoría
    console.log(`\n👑 Productos más premium por categoría:`);
    for (const [categoryName, categoryData] of Object.entries(licoresData)) {
      const mostExpensive = categoryData.productos.reduce((max, p) => 
        p.precioBotella > max.precioBotella ? p : max
      );
      console.log(`   • ${categoryName}: ${mostExpensive.nombre} - $${mostExpensive.precioBotella}`);
    }

  } catch (error) {
    console.error('❌ Error agregando licores premium:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addPremiumLiquors()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
