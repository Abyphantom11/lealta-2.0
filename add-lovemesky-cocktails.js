#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ID del business Love Me Sky
const LOVE_ME_SKY_ID = 'cmgh621rd0012lb0aixrzpvrw';

// Datos de los cócteles organizados por categoría
const coctelesData = {
  'CLÁSICOS': {
    descripcion: 'Cocktails históricos. Los más antiguos, respetados, imitados, reversionados, pero siempre originales. La historia dice que la coctelería es un mundo y el mundo dice que la historia de la coctelería.',
    productos: [
      {
        nombre: 'OLD FASHIONED',
        precio: 13.00,
        descripcion: 'Whisky, angostura bitter, almíbar, soda, piel de naranja.'
      },
      {
        nombre: 'NEW YORK SOUR',
        precio: 13.00,
        descripcion: 'Whisky, limón, almíbar, clara, vino tinto.'
      },
      {
        nombre: 'BLOODY MARY',
        precio: 13.50,
        descripcion: 'Vodka, limón, sal, pimienta, tabasco, salsa inglesa, jugo de tomate.'
      },
      {
        nombre: 'MARGARITA',
        precio: 13.00,
        descripcion: 'Tequila, triple sec, limón.'
      },
      {
        nombre: 'MANHATTAN',
        precio: 13.00,
        descripcion: 'Whisky, vermouth rosso, angostura, piel de naranja.'
      },
      {
        nombre: 'NEGRONI',
        precio: 13.00,
        descripcion: 'Campari, vermouth rosso, gin, perfume de naranja.'
      },
      {
        nombre: 'AMERICANO',
        precio: 12.00,
        descripcion: 'Campari, vermouth rosso, soda.'
      },
      {
        nombre: 'ALEXANDER',
        precio: 13.00,
        descripcion: 'Gin, licor de chocolate blanco, almíbar, crema.'
      },
      {
        nombre: 'MOJITO',
        precio: 12.00,
        descripcion: 'Ron, limón, almíbar, hierba buena, soda.'
      },
      {
        nombre: 'PISCO SOUR',
        precio: 13.00,
        descripcion: 'Pisco, limón, almíbar, clara, angostura.'
      },
      {
        nombre: 'PADRINO',
        precio: 13.00,
        descripcion: 'Whisky, amaretto.'
      }
    ]
  },
  'MODERNOS': {
    descripcion: 'Cocktails post prohibición y guerras mundiales. Las migraciones hicieron de la coctelería un movimiento mundial. Desde los 90\'s vivimos una segunda era dorada de coctelería, embebamos cultura alcohólica.',
    productos: [
      {
        nombre: 'MOSCOW MULE',
        precio: 13.00,
        descripcion: 'Vodka, limón, ginger syrup, ginger beer.'
      },
      {
        nombre: 'GREEN PARK',
        precio: 13.00,
        descripcion: 'Gin, albahaca, jugo de limón, clara, angostura bitter, almíbar.'
      },
      {
        nombre: 'PENICILLIN',
        precio: 13.00,
        descripcion: 'Whisky, syrup de miel y jengibre, limón.'
      },
      {
        nombre: 'APEROL SPRITZ',
        precio: 13.00,
        descripcion: 'Aperol, prosecco, soda.'
      },
      {
        nombre: 'BRAMBLE',
        precio: 13.50,
        descripcion: 'Gin, licor de cassis, frutos rojos, almíbar, limón.'
      },
      {
        nombre: 'LONG ISLAND ICED TEA',
        precio: 14.00,
        descripcion: 'Vodka, triple sec, tequila, ron, gin, gaseosa.'
      },
      {
        nombre: 'PALOMA',
        precio: 13.00,
        descripcion: 'Tequila, jugo de toronja, limón, soda de toronja, mix de sales.'
      }
    ]
  },
  'EXÓTICOS': {
    descripcion: 'Un infinito universo de ingredientes ha permitido a distintos bartenders crear estos elixires maravillosos.',
    productos: [
      {
        nombre: 'BASEQUITO',
        precio: 13.00,
        descripcion: 'Vodka, albahaca, limón, almíbar, soda.'
      },
      {
        nombre: 'MARY POPPINS',
        precio: 13.00,
        descripcion: 'Gin, jengibre, tomillo, limón, almíbar.'
      },
      {
        nombre: 'SINGAPORE SLING',
        precio: 13.00,
        descripcion: 'Gin, licor de marrasquino, triple sec, limón, angostura bitter, soda.'
      },
      {
        nombre: 'APPLE PIE',
        precio: 13.00,
        descripcion: 'Ron, licor de manzana verde, limón, almíbar de canela, angostura bitter, clara.'
      },
      {
        nombre: 'CHANEL COLLINS',
        precio: 13.00,
        descripcion: 'Gin, limón, almíbar, té de hibiscus, infusión de hibiscus, chicha tónica de rosas.'
      }
    ]
  },
  'TIKI TIKI': {
    descripcion: 'Movimiento popularizado por Don "The Beachcomber" lleno de culturas diversas, sabores, aromas, música y colores.',
    productos: [
      {
        nombre: 'MAI TAI',
        precio: 13.00,
        descripcion: 'Blend de rones, triple sec, limón, piña, angostura bitter, almíbar.'
      },
      {
        nombre: 'BAHAMA MAMA',
        precio: 13.00,
        descripcion: 'Blend de rones, coco, naranja, piña, angostura bitter, granadina.'
      },
      {
        nombre: 'TIKI CHAI',
        precio: 13.00,
        descripcion: 'Honey whisky, smoked whisky, orgeat chai, limón, angostura bitter, nuez moscada, clara.'
      },
      {
        nombre: 'ZOMBIE',
        precio: 13.00,
        descripcion: 'Blend de rones, triple sec, piña, naranja, limón, maracuyá, granadina.'
      }
    ]
  },
  'DE LATINOAMÉRICA': {
    descripcion: 'Un viaje lleno de sabores y colores, historia y alegría en nuestra sangre y en nuestros cócteles.',
    productos: [
      {
        nombre: 'CHILCANO (PERÚ)',
        precio: 13.00,
        descripcion: 'Pisco, limón, almíbar, angostura bitter, ginger ale.'
      },
      {
        nombre: 'GUARAPITA (VENEZUELA)',
        precio: 13.00,
        descripcion: 'Ron, vodka, limón, almíbar, mango, maracuyá, piña.'
      },
      {
        nombre: 'RABO DE GALO (BRASIL)',
        precio: 13.00,
        descripcion: 'Cachaca, vermouth rosso, campari, perfume de limón.'
      }
    ]
  },
  'REGIONALES': {
    descripcion: 'Cócteles inspirados en sabores y tradiciones locales del Ecuador.',
    productos: [
      {
        nombre: 'ALMA DE CANTUÑA',
        precio: 13.00,
        descripcion: 'Chawar, caña manabita, espíritu del Ecuador, almíbar de níspero, frutos rojos, guanábana, infusión de flores.'
      },
      {
        nombre: 'QUITUKI',
        precio: 13.00,
        descripcion: 'Gin de maracuyá, caña manabita, limón, almíbar de canela, coco, naranjilla, bitter casero.'
      },
      {
        nombre: 'JALISCO HIGHBALL',
        precio: 13.00,
        descripcion: 'Refrescante con sutiles notas de chocolate. Tequila blanco, cáscara de cacao, tamarindo y Guitig.'
      },
      {
        nombre: 'BELTADONA',
        precio: 13.00,
        descripcion: 'Gin, Aperol, naranjilla, ishpingo, limón.'
      },
      {
        nombre: 'FAIRY DUST',
        precio: 13.00,
        descripcion: 'Un sour estilo floral. Vodka, Butterfly Pea Tea, clara de huevo, Peychaud\'s Bitters, miel de pilagüa, limón.'
      },
      {
        nombre: 'ZARZATI',
        precio: 13.00,
        descripcion: 'Jugoso y sabroso con notas herbáceas. Frambuesa clarificada, hoja de higo, Vermouth Andino, caña, bitters de vainilla.'
      }
    ]
  },
  'DE AUTOR': {
    descripcion: 'Un infinito universo de ingredientes ha permitido a distintos bartenders crear estos elixires maravillosos.',
    productos: [
      {
        nombre: 'NEGRONI 159',
        precio: 13.00,
        descripcion: 'Jägermeister, vermouth rosso, gin, campari, angostura bitter, pepino.'
      },
      {
        nombre: 'MUHAMMED ALI',
        precio: 13.00,
        descripcion: 'Whiskey, almíbar de miel de abeja, licor de avellanas, limón, clara, angostura bitter, polen.'
      },
      {
        nombre: 'ROMERO Y JULIETA',
        precio: 13.00,
        descripcion: 'Gin, licor de cassis, limón, almíbar de romero, humo de romero.'
      },
      {
        nombre: 'BOTICARIO',
        precio: 13.00,
        descripcion: 'Cognac, gin, brandy, Espíritu del Ecuador, mandarina napoleón, fern, plum bitter, polvo de canela.'
      },
      {
        nombre: 'UMAMI MARGARITA',
        precio: 13.00,
        descripcion: 'Blanco, triple sec, limón, jengibre, mango picante, mix de sales de especias, una pizca de jengibre.'
      },
      {
        nombre: 'SILVER BULLET',
        precio: 13.00,
        descripcion: 'Gin, vermouth dry, cáscara de naranja, almíbar, bitter.'
      },
      {
        nombre: 'RED COTTON',
        precio: 13.00,
        descripcion: 'Gin, limón, almíbar, frutos rojos y Red Bull Energy Drink.'
      }
    ]
  },
  'COLABORACIÓN CON SARAH RUIZ': {
    descripcion: 'Cócteles especiales creados en colaboración con la reconocida bartender Sarah Ruiz.',
    productos: [
      {
        nombre: 'TIQI',
        precio: 13.00,
        descripcion: 'Tropical y verde. Havana Club, piña caramelizada, chillangua, jalapeño y jengibre.'
      },
      {
        nombre: 'PORN STAR RETIRADO',
        precio: 13.00,
        descripcion: 'Tropical y espumado. Spiced Rum, fernet, maracuyá, sal, espumante.'
      },
      {
        nombre: 'HORCHATINI',
        precio: 13.00,
        descripcion: 'Martini aromático y sedoso. Tanqueray Gin, aceite de oliva, horchata moscato, jamaica bitters.'
      },
      {
        nombre: 'MALO SANTO',
        precio: 13.00,
        descripcion: 'Fuerte y especiado con notas de chocolate. Chivas 12, palo santo, Pedro Ximénez, chocolate, sal.'
      }
    ]
  },
  'ABUELO SPECIALS': {
    descripcion: 'Cócteles especiales elaborados con Ron Abuelo, destacando la calidad y tradición de esta marca premium.',
    productos: [
      {
        nombre: 'ABUELO COLLINS',
        precio: 12.50,
        descripcion: 'Ron Abuelo 7 años, limón, almíbar, soda de toronja.'
      },
      {
        nombre: 'ESPRESSO DAQUIRI',
        precio: 13.00,
        descripcion: 'Ron Abuelo 7 años, café espresso, licor de café, kahluá, almíbar mascabo, solución salina.'
      },
      {
        nombre: 'NEGRONI OLD ABUELO',
        precio: 13.00,
        descripcion: 'Ron Abuelo 12 años, vermouth rosso, campari, bitter de naranja.'
      },
      {
        nombre: 'THE OLD SIDEBAR',
        precio: 12.50,
        descripcion: 'Abuelo 7 años, coñac, limón, almíbar mascabo.'
      },
      {
        nombre: 'OLD BASIL CUBAN',
        precio: 13.00,
        descripcion: 'Ron Abuelo 7 años, almíbar, limón, albahaca.'
      },
      {
        nombre: 'EL PRESIDENTE',
        precio: 14.00,
        descripcion: 'Ron Abuelo 12 años, angostura, vermouth rosso, triple sec, granadina, bitter de angostura.'
      }
    ]
  }
};

async function main() {
  try {
    console.log('🍹 Agregando carta de cócteles a Love Me Sky...\n');

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

    // Crear categorías y productos de cócteles
    for (const [categoryName, categoryData] of Object.entries(coctelesData)) {
      console.log(`\n🍸 Creando categoría: ${categoryName}`);
      
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
        console.log(`   🍹 Agregando: ${product.nombre} - $${product.precio}`);
        
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

      console.log(`✅ ${categoryData.productos.length} cócteles agregados a ${categoryName}`);
      categoryOrder++;
    }

    console.log(`\n🎉 ¡Carta de cócteles agregada exitosamente!`);
    console.log(`📊 Resumen:`);
    console.log(`   • ${Object.keys(coctelesData).length} categorías de cócteles creadas`);
    console.log(`   • ${totalProducts} cócteles agregados`);
    
    // Mostrar resumen por categoría
    for (const [categoryName, categoryData] of Object.entries(coctelesData)) {
      console.log(`   • ${categoryName}: ${categoryData.productos.length} cócteles`);
    }

    // Mostrar estadísticas de precios
    const allProducts = Object.values(coctelesData).flatMap(cat => cat.productos);
    const prices = allProducts.map(p => p.precio);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2);

    console.log(`\n💰 Estadísticas de precios:`);
    console.log(`   • Precio mínimo: $${minPrice}`);
    console.log(`   • Precio máximo: $${maxPrice}`);
    console.log(`   • Precio promedio: $${avgPrice}`);

  } catch (error) {
    console.error('❌ Error agregando carta de cócteles:', error);
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
