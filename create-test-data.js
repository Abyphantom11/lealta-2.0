const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    const businessId = 'cmfqhepmq0000ey4slyms4knv';
    
    console.log('🎯 Creando promoción de prueba...');
    const promocion = await prisma.portalPromocion.create({
      data: {
        businessId: businessId,
        title: 'Promoción Test 20% OFF',
        description: 'Descuento especial en todos los productos',
        imageUrl: '/uploads/cmfqhepmq0000ey4slyms4knv_1758273692313-vn9kw.jpg',
        discount: '20% OFF',
        active: true,
        orden: 1
      }
    });
    console.log('✅ Promoción creada:', promocion.id);
    
    console.log('🎁 Creando recompensa de prueba...');
    const recompensa = await prisma.portalRecompensa.create({
      data: {
        businessId: businessId,
        title: 'Café Gratis',
        description: 'Canjea por un café americano gratis',
        pointsCost: 500,
        imageUrl: '/uploads/cmfqhepmq0000ey4slyms4knv_1758273692313-vn9kw.jpg',
        active: true,
        orden: 1,
        unlimited: false,
        stock: 10,
        category: 'bebidas'
      }
    });
    console.log('✅ Recompensa creada:', recompensa.id);
    
    console.log('⭐ Creando favorito del día...');
    const favorito = await prisma.portalFavoritoDelDia.create({
      data: {
        businessId: businessId,
        productName: 'Arepa Especial del Día',
        description: 'Arepa rellena con pollo y aguacate',
        imageUrl: '/uploads/cmfqhepmq0000ey4slyms4knv_1758273692313-vn9kw.jpg',
        originalPrice: 15000,
        specialPrice: 12000,
        specialOffer: '20% descuento especial',
        date: new Date(),
        active: true
      }
    });
    console.log('✅ Favorito del día creado:', favorito.id);
    
    console.log('🎉 Datos de prueba creados exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
