#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LOVE_ME_SKY_ID = 'cmgh621rd0012lb0aixrzpvrw';

const specialsData = {
  'MARTINI LOVERS': {
    descripcion: 'Quien haya probado un martini alguna vez, sea cual sea su variante, conoce lo que esto significa: historia, cultura, intensidad, carácter, personalidad. Un gusto adquirido por lo especial. Un tanto excéntrico, más no arrogante. Un martini es algo tan único como cada experiencia que lo prosigue, siempre trae algo especial que lo hace inolvidable cada vez que lo tomas.',
    productos: [
      { nombre: 'MARTINI CLÁSICO', precio: 13.00, descripcion: 'Gin, vermouth seco, bitter de naranja, aceitunas.' },
      { nombre: 'PORNSTAR MARTINI', precio: 13.00, descripcion: 'Vodka, infusionado con vainilla, triple sec, maracuyá, almíbar de vainilla, shot de espumante.' },
      { nombre: 'COSMOPOLITAN', precio: 13.00, descripcion: 'Vodka, triple sec (licor de naranja), jugo de limón, bitter de naranja, jugo de arándanos rojos.' },
      { nombre: 'MARTINI SUCIO', precio: 13.00, descripcion: 'Similar al Martini Clásico con intenso sabor a aceituna y salmuera, dado que lleva estos en su mezcla.' },
      { nombre: 'VESPER MARTINI', precio: 13.00, descripcion: 'Gin, vermouth dulce y vodka, perfume de limón.' },
      { nombre: 'ESPRESSO MARTINI', precio: 13.00, descripcion: 'Vodka, almíbar simple, kahlúa (licor de café), café espresso.' },
      { nombre: 'MARTÍNEZ', precio: 13.00, descripcion: 'Gin, vermouth rosso, angostura bitter, cointreau (licor de naranja), almíbar simple, perfume de naranja.' },
      { nombre: 'APPLE MARTINI', precio: 13.00, descripcion: 'Vodka, licor de manzana, bitter de naranja, manzana verde.' }
    ]
  },
  'MOCKTAILS (CERO ALCOHOL)': {
    descripcion: 'Porque la coctelería no es solo alcohol y fiesta: También es vida sana y fiesta.',
    productos: [
      { nombre: 'VIRGIN MULE', precio: 7.00, descripcion: 'Limón, almíbar de jengibre, ginger beer.' },
      { nombre: 'CITRUS BLASTER', precio: 7.00, descripcion: 'Limón, naranja, toronja, miel de abeja, ginger beer.' },
      { nombre: 'ESPRESSO TONIC', precio: 7.00, descripcion: 'Café espresso, bitter aromático, miel de abeja, agua tónica especiada.' },
      { nombre: 'KYMOMO', precio: 7.00, descripcion: 'Frutos rojos, albahaca, limón, almíbar, Red Bull Energy Drink.' },
      { nombre: 'RED BULL TWIST', precio: 7.00, descripcion: 'Hierba buena, limón, almíbar, manzana, Red Bull Energy Drink.' },
      { nombre: 'VICTORIA COLLINS', precio: 7.00, descripcion: 'Café americano, horchata, limón, almíbar de café y azúcar morena, chinchona tónica.' },
      { nombre: 'SUMMER TWIST', precio: 7.00, descripcion: 'Sirope hibiscus, limón, jengibre, chinchona rosas, perfume de sandía, Red Bull Energy Drink.' }
    ]
  },
  'RED BULL COCKTAILS': {
    descripcion: 'Cócteles energéticos con Red Bull Energy Drink.',
    productos: [
      { nombre: 'SUMMER BULL', precio: 13.00, descripcion: 'Limón, Aperol, naranja, Red Bull Energy Drink.' },
      { nombre: 'REDBULL SBAGLIATTO', precio: 13.00, descripcion: 'Campari, gin, vermouth, Red Bull Energy Drink.' },
      { nombre: 'REDBULL SUNSET', precio: 13.00, descripcion: 'Ron Abuelo añejo, maracuyá, mango, Red Bull Energy Drink.' }
    ]
  },
  'VINOS': {
    descripcion: 'Selección de vinos por botella y copa.',
    productos: [
      { nombre: 'Calvet Rosé D’anjou (Fra)', precio: 45.00, descripcion: 'Botella $45.00 | Copa $8.50' },
      { nombre: 'Calvet Cabernet Sauvignon (Fra)', precio: 40.00, descripcion: 'Botella $40.00 | Copa $7.50' },
      { nombre: 'Calvet Merlot (Fra)', precio: 40.00, descripcion: 'Botella $40.00 | Copa $7.50' },
      { nombre: 'Calvet Sauvignon Blanc (Fra)', precio: 40.00, descripcion: 'Botella $40.00 | Copa $7.50' },
      { nombre: 'Casillero del Diablo Red Blend (Chi)', precio: 45.00, descripcion: 'Botella $45.00 | Copa $8.50' },
      { nombre: 'Sapo de otro pozo Red Blend (Arg)', precio: 80.00, descripcion: 'Botella $80.00 | Copa ----' }
    ]
  }
};

async function main() {
  try {
    console.log('🍸 Agregando especiales y vinos a Love Me Sky...\n');
    const business = await prisma.business.findUnique({ where: { id: LOVE_ME_SKY_ID } });
    if (!business) {
      console.error('❌ Business Love Me Sky no encontrado');
      return;
    }
    console.log(`✅ Business encontrado: ${business.name}`);
    // Obtener el orden actual más alto de las categorías existentes
    const lastCategory = await prisma.menuCategory.findFirst({ where: { businessId: LOVE_ME_SKY_ID }, orderBy: { orden: 'desc' } });
    let categoryOrder = lastCategory ? lastCategory.orden + 1 : 1;
    let totalProducts = 0;
    for (const [categoryName, categoryData] of Object.entries(specialsData)) {
      console.log(`\n🍸 Creando categoría: ${categoryName}`);
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
      let productOrder = 1;
      for (const product of categoryData.productos) {
        console.log(`   🍷 Agregando: ${product.nombre} - $${product.precio}`);
        await prisma.menuProduct.create({
          data: {
            categoryId: category.id,
            nombre: product.nombre,
            descripcion: product.descripcion,
            precio: product.precio,
            tipoProducto: 'simple',
            disponible: true,
            destacado: false,
            orden: productOrder
          }
        });
        productOrder++;
        totalProducts++;
      }
      console.log(`✅ ${categoryData.productos.length} productos agregados a ${categoryName}`);
      categoryOrder++;
    }
    console.log(`\n🎉 ¡Especiales y vinos agregados exitosamente!`);
    console.log(`📊 Resumen:`);
    console.log(`   • ${Object.keys(specialsData).length} categorías creadas`);
    console.log(`   • ${totalProducts} productos agregados`);
    for (const [categoryName, categoryData] of Object.entries(specialsData)) {
      console.log(`   • ${categoryName}: ${categoryData.productos.length} productos`);
    }
  } catch (error) {
    console.error('❌ Error agregando especiales y vinos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
