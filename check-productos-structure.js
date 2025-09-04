// Script para verificar la estructura de productos en consumos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductosStructure() {
  try {
    console.log('🔍 Verificando estructura de productos en consumos...');
    
    const consumos = await prisma.consumo.findMany({
      take: 5,
      include: {
        cliente: true,
        empleado: true,
      },
      orderBy: {
        registeredAt: 'desc'
      }
    });

    console.log(`📊 Encontrados ${consumos.length} consumos:`);
    
    consumos.forEach((consumo, index) => {
      console.log(`\n--- Consumo ${index + 1} ---`);
      console.log(`ID: ${consumo.id}`);
      console.log(`Cliente: ${consumo.cliente.nombre}`);
      console.log(`Total: $${consumo.total}`);
      console.log(`Fecha: ${consumo.registeredAt}`);
      console.log(`Productos (raw):`, JSON.stringify(consumo.productos, null, 2));
      
      // Analizar estructura
      if (Array.isArray(consumo.productos)) {
        console.log(`✅ Productos es un array con ${consumo.productos.length} items`);
        consumo.productos.forEach((producto, i) => {
          console.log(`  Producto ${i + 1}:`, {
            nombre: producto.nombre || producto.name || 'Sin nombre',
            precio: producto.precio || producto.price || 0,
            cantidad: producto.cantidad || producto.quantity || 1
          });
        });
      } else if (typeof consumo.productos === 'object') {
        console.log(`⚠️ Productos es un objeto:`, Object.keys(consumo.productos));
      } else {
        console.log(`❌ Productos tiene estructura inesperada:`, typeof consumo.productos);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductosStructure();
