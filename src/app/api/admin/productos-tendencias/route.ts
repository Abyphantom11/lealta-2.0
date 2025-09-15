import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductoVentas {
  id: string;
  nombre: string;
  cantidadTotal: number;
  ingresoTotal: number;
  ventasSemana: {
    semana: string;
    fecha: string;
    cantidad: number;
    ingresos: number;
  }[];
}

export async function GET() {
  try {
    const businessId = 'cmes3g9wd0000eyggpbqfl9r6'; // ID del negocio
    
    // Obtener TODOS los consumos para la demo (sin filtro de fecha)
    const consumos = await prisma.consumo.findMany({
      where: {
        OR: [
          { businessId: businessId },
          { businessId: null } // Incluir también datos de prueba sin businessId
        ]
      },
      orderBy: {
        registeredAt: 'asc'
      }
    });

    console.log(`📊 Productos Tendencias - Total consumos encontrados: ${consumos.length}`);

    // Mapa para almacenar estadísticas por producto
    const productosMap = new Map<string, {
      cantidadTotal: number;
      ingresoTotal: number;
      ventasPorSemana: Map<string, { cantidad: number; ingresos: number }>;
    }>();

    // Procesar cada consumo
    consumos.forEach(consumo => {
      const productosData = consumo.productos as any;
      const fechaConsumo = new Date(consumo.registeredAt);
      
      // Obtener número de semana
      const inicioAno = new Date(fechaConsumo.getFullYear(), 0, 1);
      const semana = Math.ceil(((fechaConsumo.getTime() - inicioAno.getTime()) / 86400000 + inicioAno.getDay() + 1) / 7);
      const claveSemanaq = `${fechaConsumo.getFullYear()}-S${semana.toString().padStart(2, '0')}`;
      
      // Extraer el array de productos del objeto
      const productos = productosData?.items || productosData || [];
      
      if (Array.isArray(productos)) {
        productos.forEach(producto => {
          if (producto.nombre && producto.cantidad) {
            const nombreProducto = producto.nombre.toString().trim();
            const cantidad = parseInt(producto.cantidad) || 1;
            const precio = parseFloat(producto.precio) || 0;
            const ingresoProducto = cantidad * precio;

            // Inicializar producto si no existe
            if (!productosMap.has(nombreProducto)) {
              productosMap.set(nombreProducto, {
                cantidadTotal: 0,
                ingresoTotal: 0,
                ventasPorSemana: new Map()
              });
            }

            const productData = productosMap.get(nombreProducto)!;
            
            // Actualizar totales
            productData.cantidadTotal += cantidad;
            productData.ingresoTotal += ingresoProducto;

            // Actualizar datos por semana
            if (!productData.ventasPorSemana.has(claveSemanaq)) {
              productData.ventasPorSemana.set(claveSemanaq, { cantidad: 0, ingresos: 0 });
            }
            
            const ventaSemana = productData.ventasPorSemana.get(claveSemanaq)!;
            ventaSemana.cantidad += cantidad;
            ventaSemana.ingresos += ingresoProducto;
          }
        });
      }
    });

    // Convertir a array y ordenar por ventas totales
    const productosArray: ProductoVentas[] = Array.from(productosMap.entries())
      .map(([nombre, data]) => {
        // Convertir ventas por semana a array ordenado
        const ventasSemana = Array.from(data.ventasPorSemana.entries())
          .map(([claveSemanaq, ventas]) => {
            // Extraer año y semana
            const [ano, semanaStr] = claveSemanaq.split('-S');
            const numeroSemana = parseInt(semanaStr);
            
            // Calcular fecha aproximada del inicio de la semana
            const inicioAno = new Date(parseInt(ano), 0, 1);
            const fechaInicioSemana = new Date(inicioAno);
            fechaInicioSemana.setDate(fechaInicioSemana.getDate() + (numeroSemana - 1) * 7);
            
            return {
              semana: claveSemanaq,
              fecha: fechaInicioSemana.toISOString(),
              cantidad: ventas.cantidad,
              ingresos: ventas.ingresos
            };
          })
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

        return {
          id: nombre.toLowerCase().replace(/\s+/g, '-'),
          nombre,
          cantidadTotal: data.cantidadTotal,
          ingresoTotal: data.ingresoTotal,
          ventasSemana
        };
      })
      .sort((a, b) => b.ingresoTotal - a.ingresoTotal) // Ordenar por ingresos totales
      .slice(0, 5); // Top 5 productos

    console.log(`📊 Top 5 productos procesados:`, productosArray.map(p => ({
      nombre: p.nombre,
      cantidadTotal: p.cantidadTotal,
      ingresoTotal: p.ingresoTotal,
      semanasData: p.ventasSemana.length
    })));

    return NextResponse.json({
      productos: productosArray,
      timestamp: new Date().toISOString(),
      periodo: {
        desde: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Últimos 90 días
        hasta: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo tendencias de productos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
