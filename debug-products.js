// Script para debuggear el cálculo de productos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProductCalculation() {
  try {
    console.log('🔍 Debugging product calculation...');
    
    const consumos = await prisma.consumo.findMany({
      take: 3,
      include: {
        cliente: true,
        empleado: true,
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    console.log(`📊 Found ${consumos.length} consumos`);
    
    // Recrear la misma lógica del API
    const productosVendidos = consumos.reduce(
      (acc, consumo) => {
        console.log(`\n--- Processing consumo ${consumo.id} ---`);
        console.log('Raw productos:', JSON.stringify(consumo.productos, null, 2));
        
        // Verificar que productos tiene la estructura correcta
        if (consumo.productos && typeof consumo.productos === 'object') {
          const productos = consumo.productos;
          console.log('✅ productos is an object');
          console.log('productos keys:', Object.keys(productos));
          
          if (Array.isArray(productos.items)) {
            console.log(`✅ productos.items is an array with ${productos.items.length} items`);
            
            productos.items.forEach((producto, i) => {
              console.log(`  Processing product ${i}:`, {
                nombre: producto.nombre,
                cantidad: producto.cantidad,
                precio: producto.precio
              });
              
              const nombre = producto.nombre || 'Producto sin nombre';
              const cantidad = producto.cantidad || 1;
              const precio = producto.precio || 0;

              if (!acc[nombre]) {
                acc[nombre] = {
                  nombre: nombre,
                  sales: 0,
                  revenue: 0,
                };
                console.log(`  ✨ Created new product entry: ${nombre}`);
              }

              acc[nombre].sales += cantidad;
              acc[nombre].revenue += precio * cantidad;
              
              console.log(`  📈 Updated ${nombre}:`, {
                sales: acc[nombre].sales,
                revenue: acc[nombre].revenue
              });
            });
          } else {
            console.log('❌ productos.items is not an array:', typeof productos.items);
          }
        } else {
          console.log('❌ productos is not an object:', typeof consumo.productos);
        }
        
        return acc;
      },
      {}
    );

    console.log('\n🛍️ Final productosVendidos:', JSON.stringify(productosVendidos, null, 2));

    // Top 5 productos por cantidad vendida
    const topProducts = Object.values(productosVendidos)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((producto) => ({
        name: producto.nombre,
        sales: producto.sales,
        revenue: producto.revenue,
        trend: '+0%'
      }));

    console.log('\n🏆 Final topProducts:', JSON.stringify(topProducts, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProductCalculation();
