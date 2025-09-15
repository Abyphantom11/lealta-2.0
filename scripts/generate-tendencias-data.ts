// Script para poblar datos de ejemplo para el gráfico de tendencias de productos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const businessId = null; // temporalmente opcional
const clienteId = 'cmfkgyn6t000geycsjbirdius'; // ID del cliente 'jose'
const locationId = 'cmfhbj2lt0004ey50ryu2vzvp'; // ID de 'arepa - Principal'
const empleadoId = 'cmfhbj2lo0002ey508rblemuy'; // ID del SUPERADMIN 'abrahan'

// Productos populares del bar
const productos = [
  { nombre: 'VIRGIN MULE', precio: 12.5, categoria: 'Cóctel sin alcohol' },
  { nombre: 'JOSE CUERVO BLANCO SHOT', precio: 8.0, categoria: 'Shots' },
  { nombre: 'ROYAL LEMONADE', precio: 10.0, categoria: 'Bebidas especiales' },
  { nombre: 'SMIRNOFF SPICY VASO', precio: 15.0, categoria: 'Cócteles' },
  { nombre: 'AGUA NORMAL', precio: 3.0, categoria: 'Bebidas básicas' },
  { nombre: 'MOJITO CLÁSICO', precio: 14.0, categoria: 'Cócteles' },
  { nombre: 'PIÑA COLADA', precio: 16.0, categoria: 'Cócteles tropicales' },
  { nombre: 'MARGARITA', precio: 13.5, categoria: 'Cócteles' },
  { nombre: 'CERVEZA ARTESANAL', precio: 7.5, categoria: 'Cervezas' },
  { nombre: 'WINGS BBQ', precio: 22.0, categoria: 'Comida' }
];

async function generarConsumosSemana() {
  try {
    console.log('🚀 Iniciando generación de datos de ejemplo...');

    // Generar consumos para las últimas 8 semanas
    const fechaActual = new Date();
    const consumosGenerados = [];

    for (let semana = 7; semana >= 0; semana--) {
      // Calcular fecha de la semana
      const fechaSemana = new Date(fechaActual);
      fechaSemana.setDate(fechaSemana.getDate() - (semana * 7));
      
      // Generar entre 3-8 consumos por semana
      const numConsumos = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < numConsumos; i++) {
        // Fecha aleatoria dentro de la semana
        const fechaConsumo = new Date(fechaSemana);
        fechaConsumo.setDate(fechaConsumo.getDate() + Math.floor(Math.random() * 7));
        fechaConsumo.setHours(18 + Math.floor(Math.random() * 6)); // Entre 6 PM y 12 AM
        fechaConsumo.setMinutes(Math.floor(Math.random() * 60));

        // Seleccionar 1-4 productos aleatorios
        const numProductos = Math.floor(Math.random() * 4) + 1;
        const productosSeleccionados = [];
        const productosUsados = new Set();
        
        let totalConsumo = 0;
        
        for (let j = 0; j < numProductos; j++) {
          let productoIndex;
          do {
            productoIndex = Math.floor(Math.random() * productos.length);
          } while (productosUsados.has(productoIndex));
          
          productosUsados.add(productoIndex);
          const producto = productos[productoIndex];
          const cantidad = Math.floor(Math.random() * 3) + 1; // 1-3 unidades
          
          productosSeleccionados.push({
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: cantidad,
            categoria: producto.categoria
          });
          
          totalConsumo += producto.precio * cantidad;
        }

        // Crear el consumo
        const consumo = await prisma.consumo.create({
          data: {
            businessId,
            clienteId,
            locationId,
            empleadoId,
            productos: {
              items: productosSeleccionados,
              total: totalConsumo,
              empleado: 'Script generado',
              confianza: 1.0,
              notas: 'Datos de ejemplo para gráfico de tendencias'
            },
            total: totalConsumo,
            puntos: Math.floor(totalConsumo * 4), // 4 puntos por peso
            pagado: true,
            metodoPago: 'efectivo',
            registeredAt: fechaConsumo,
            paidAt: fechaConsumo
          }
        });

        consumosGenerados.push(consumo);
        console.log(`✅ Consumo creado: ${fechaConsumo.toISOString().slice(0, 10)} - $${totalConsumo.toFixed(2)} - ${productosSeleccionados.length} productos`);
      }
    }

    console.log(`🎉 Generados ${consumosGenerados.length} consumos de ejemplo exitosamente!`);
    console.log(`📊 Productos incluidos: ${productos.map(p => p.nombre).join(', ')}`);

  } catch (error) {
    console.error('❌ Error generando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
generarConsumosSemana();
