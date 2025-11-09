const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script para crear clientes demo con diferentes niveles de tarjetas
 * y generar consumos realistas vinculados al menú
 */

// Datos realistas de clientes
const clientesDemo = [
  // NIVEL PLATINO (1000+ puntos) - 2 clientes (10%)
  {
    nombre: 'Carlos',
    apellido: 'Mendoza Silva',    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('\n═══════════════════════════════════════');
    console.log('✅ DATOS DEMO CREADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════');
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`- Negocio: ${demoBusiness.name}`);
    console.log(`- Total clientes creados: ${totalClientesCreados}`);
    console.log(`- Total consumos generados: ${totalConsumosCreados}`);
    console.log(`\n🏆 Análisis de niveles estimados (basado en puntos):`);6384751',
    email: 'carlos.mendoza@email.com',
    telefono: '0998765432',
    puntosObjetivo: 1250,
  },
  {
    nombre: 'María',
    apellido: 'Torres Vargas',
    cedula: '0915273846',
    email: 'maria.torres@email.com',
    telefono: '0987654321',
    puntosObjetivo: 1450,
  },
  
  // NIVEL DIAMANTE (500-1000 puntos) - 2 clientes (10%)
  {
    nombre: 'Roberto',
    apellido: 'Guzmán López',
    cedula: '0934567891',
    email: 'roberto.guzman@email.com',
    telefono: '0991234567',
    puntosObjetivo: 750,
  },
  {
    nombre: 'Ana',
    apellido: 'Flores Castro',
    cedula: '0923456789',
    email: 'ana.flores@email.com',
    telefono: '0989876543',
    puntosObjetivo: 650,
  },
  
  // NIVEL ORO (250-500 puntos) - 4 clientes (20%)
  {
    nombre: 'Diego',
    apellido: 'Ruiz Moreno',
    cedula: '0912345678',
    email: 'diego.ruiz@email.com',
    telefono: '0995678901',
    puntosObjetivo: 420,
  },
  {
    nombre: 'Laura',
    apellido: 'Campos Rivera',
    cedula: '0934512890',
    email: 'laura.campos@email.com',
    telefono: '0992345678',
    puntosObjetivo: 380,
  },
  {
    nombre: 'Fernando',
    apellido: 'Vega Santos',
    cedula: '0921234567',
    email: 'fernando.vega@email.com',
    telefono: '0987123456',
    puntosObjetivo: 310,
  },
  {
    nombre: 'Patricia',
    apellido: 'Ortiz Peña',
    cedula: '0913456789',
    email: 'patricia.ortiz@email.com',
    telefono: '0994567890',
    puntosObjetivo: 280,
  },
  
  // NIVEL PLATA (100-250 puntos) - 6 clientes (30%)
  {
    nombre: 'Andrés',
    apellido: 'Sánchez Díaz',
    cedula: '0925678901',
    email: 'andres.sanchez@email.com',
    telefono: '0996789012',
    puntosObjetivo: 210,
  },
  {
    nombre: 'Gabriela',
    apellido: 'Ramírez Luna',
    cedula: '0914567890',
    email: 'gabriela.ramirez@email.com',
    telefono: '0983456789',
    puntosObjetivo: 180,
  },
  {
    nombre: 'Miguel',
    apellido: 'Herrera Cruz',
    cedula: '0936789012',
    email: 'miguel.herrera@email.com',
    telefono: '0991234890',
    puntosObjetivo: 150,
  },
  {
    nombre: 'Valeria',
    apellido: 'Paredes Gil',
    cedula: '0922345678',
    email: 'valeria.paredes@email.com',
    telefono: '0988765432',
    puntosObjetivo: 135,
  },
  {
    nombre: 'Javier',
    apellido: 'Molina Ramos',
    cedula: '0917890123',
    email: 'javier.molina@email.com',
    telefono: '0993456789',
    puntosObjetivo: 120,
  },
  {
    nombre: 'Daniela',
    apellido: 'Núñez Vera',
    cedula: '0935678901',
    email: 'daniela.nunez@email.com',
    telefono: '0986543210',
    puntosObjetivo: 105,
  },
  
  // NIVEL BRONCE (0-100 puntos) - 6 clientes (30%)
  {
    nombre: 'Sebastián',
    apellido: 'Reyes Maldonado',
    cedula: '0919876543',
    email: 'sebastian.reyes@email.com',
    telefono: '0997654321',
    puntosObjetivo: 85,
  },
  {
    nombre: 'Camila',
    apellido: 'Figueroa Soto',
    cedula: '0928765432',
    email: 'camila.figueroa@email.com',
    telefono: '0984567890',
    puntosObjetivo: 65,
  },
  {
    nombre: 'Cristian',
    apellido: 'Navarro Peña',
    cedula: '0916543210',
    email: 'cristian.navarro@email.com',
    telefono: '0992345876',
    puntosObjetivo: 50,
  },
  {
    nombre: 'Nicole',
    apellido: 'Aguirre Morales',
    cedula: '0937654321',
    email: 'nicole.aguirre@email.com',
    telefono: '0989123456',
    puntosObjetivo: 35,
  },
  {
    nombre: 'Mateo',
    apellido: 'Salazar Bravo',
    cedula: '0924321098',
    email: 'mateo.salazar@email.com',
    telefono: '0995432109',
    puntosObjetivo: 20,
  },
  {
    nombre: 'Isabella',
    apellido: 'Cordero León',
    cedula: '0911234567',
    email: 'isabella.cordero@email.com',
    telefono: '0981234567',
    puntosObjetivo: 10,
  },
];

function obtenerNivelTarjeta(puntos) {
  if (puntos >= 1000) return 'PLATINO';
  if (puntos >= 500) return 'DIAMANTE';
  if (puntos >= 250) return 'ORO';
  if (puntos >= 100) return 'PLATA';
  return 'BRONCE';
}

function generarFechaAleatoria(diasAtras) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - Math.floor(Math.random() * diasAtras));
  return fecha;
}

async function crearClientesYConsumos() {
  try {
    console.log('👥 Iniciando creación de clientes y consumos demo...\n');

    // Buscar el negocio Demo
    const demoBusiness = await prisma.business.findFirst({
      where: {
        name: {
          contains: 'Demo',
        },
      },
      include: {
        MenuCategory: {
          include: {
            MenuProduct: true,
          },
        },
      },
    });

    if (!demoBusiness) {
      console.log('❌ No se encontró el negocio Demo');
      return;
    }

    console.log(`✅ Negocio encontrado: ${demoBusiness.name}\n`);

    // Obtener todos los productos del menú
    const todosProductos = demoBusiness.MenuCategory.flatMap(cat => cat.MenuProduct);
    console.log(`📋 Productos disponibles en menú: ${todosProductos.length}\n`);

    if (todosProductos.length === 0) {
      console.log('❌ No hay productos en el menú. Ejecuta primero crear-menu-demo.js');
      return;
    }

    // Categorizar productos para consumos realistas
    const entradas = todosProductos.filter(p => p.categoryId === demoBusiness.MenuCategory.find(c => c.nombre.includes('Entrada'))?.id);
    const platos = todosProductos.filter(p => p.categoryId === demoBusiness.MenuCategory.find(c => c.nombre.includes('Platos Fuertes'))?.id);
    const postres = todosProductos.filter(p => p.categoryId === demoBusiness.MenuCategory.find(c => c.nombre.includes('Postres'))?.id);
    const bebidas = todosProductos.filter(p => p.categoryId === demoBusiness.MenuCategory.find(c => c.nombre.includes('sin Alcohol'))?.id);
    const cocteles = todosProductos.filter(p => p.categoryId === demoBusiness.MenuCategory.find(c => c.nombre.includes('Cócteles'))?.id);
    const cervezas = todosProductos.filter(p => p.categoryId === demoBusiness.MenuCategory.find(c => c.nombre.includes('Cervezas'))?.id);
    const botellas = todosProductos.filter(p => p.categoryId === demoBusiness.MenuCategory.find(c => c.nombre.includes('Botellas'))?.id);
    const vinos = todosProductos.filter(p => p.categoryId === demoBusiness.MenuCategory.find(c => c.nombre.includes('Vinos'))?.id);

    let totalClientesCreados = 0;
    let totalConsumosCreados = 0;

    // Crear clientes y sus consumos
    for (const clienteData of clientesDemo) {
      console.log(`\n👤 Creando cliente: ${clienteData.nombre} ${clienteData.apellido}...`);

      // Crear cliente
      const nombreCompleto = `${clienteData.nombre} ${clienteData.apellido}`;
      const cliente = await prisma.cliente.create({
        data: {
          businessId: demoBusiness.id,
          nombre: nombreCompleto,
          cedula: clienteData.cedula,
          correo: clienteData.email,
          telefono: clienteData.telefono,
          puntos: 0,
        },
      });

      totalClientesCreados++;

      // Generar consumos para alcanzar el objetivo de puntos
      let puntosAcumulados = 0;
      let numeroConsumos = 0;
      const puntosObjetivo = clienteData.puntosObjetivo;

      // Determinar número de visitas según nivel objetivo
      let numVisitas;
      if (puntosObjetivo >= 1000) numVisitas = Math.floor(Math.random() * 10) + 15; // 15-25 visitas para Platino
      else if (puntosObjetivo >= 500) numVisitas = Math.floor(Math.random() * 8) + 10; // 10-18 visitas para Diamante
      else if (puntosObjetivo >= 250) numVisitas = Math.floor(Math.random() * 6) + 7; // 7-13 visitas para Oro
      else if (puntosObjetivo >= 100) numVisitas = Math.floor(Math.random() * 5) + 4; // 4-9 visitas para Plata
      else numVisitas = Math.floor(Math.random() * 3) + 1; // 1-4 visitas para Bronce

      console.log(`   💰 Objetivo: ${puntosObjetivo} puntos en ${numVisitas} visitas`);

      for (let i = 0; i < numVisitas && puntosAcumulados < puntosObjetivo; i++) {
        const productosConsumo = [];
        let totalConsumo = 0;

        // Generar consumo realista (entrada + plato + bebida/postre)
        const tipoVisita = Math.random();

        if (tipoVisita < 0.3) {
          // Visita ligera (30%): solo bebida o entrada
          if (Math.random() < 0.5 && bebidas.length > 0) {
            const bebida = bebidas[Math.floor(Math.random() * bebidas.length)];
            productosConsumo.push({ producto: bebida, cantidad: 1 });
            totalConsumo += bebida.precio || 0;
          } else if (entradas.length > 0) {
            const entrada = entradas[Math.floor(Math.random() * entradas.length)];
            productosConsumo.push({ producto: entrada, cantidad: 1 });
            totalConsumo += entrada.precio || 0;
          }
        } else if (tipoVisita < 0.7) {
          // Visita normal (40%): plato + bebida
          if (platos.length > 0) {
            const plato = platos[Math.floor(Math.random() * platos.length)];
            productosConsumo.push({ producto: plato, cantidad: 1 });
            totalConsumo += plato.precio || 0;
          }
          if (bebidas.length > 0 && Math.random() < 0.8) {
            const bebida = bebidas[Math.floor(Math.random() * bebidas.length)];
            productosConsumo.push({ producto: bebida, cantidad: 1 });
            totalConsumo += bebida.precio || 0;
          }
        } else {
          // Visita completa (30%): entrada + plato + bebida + postre/cóctel
          if (entradas.length > 0 && Math.random() < 0.6) {
            const entrada = entradas[Math.floor(Math.random() * entradas.length)];
            productosConsumo.push({ producto: entrada, cantidad: 1 });
            totalConsumo += entrada.precio || 0;
          }
          if (platos.length > 0) {
            const plato = platos[Math.floor(Math.random() * platos.length)];
            productosConsumo.push({ producto: plato, cantidad: 1 });
            totalConsumo += plato.precio || 0;
          }
          
          // Bebida o cóctel
          if (Math.random() < 0.5 && cocteles.length > 0) {
            const coctel = cocteles[Math.floor(Math.random() * cocteles.length)];
            productosConsumo.push({ producto: coctel, cantidad: 1 });
            totalConsumo += coctel.precio || 0;
          } else if (cervezas.length > 0) {
            const cerveza = cervezas[Math.floor(Math.random() * cervezas.length)];
            const cantidad = Math.floor(Math.random() * 2) + 1;
            productosConsumo.push({ producto: cerveza, cantidad });
            totalConsumo += (cerveza.precio || 0) * cantidad;
          }
          
          // Postre o botella (para VIPs)
          if (puntosObjetivo >= 500 && Math.random() < 0.4) {
            if (Math.random() < 0.5 && botellas.length > 0) {
              const botella = botellas[Math.floor(Math.random() * botellas.length)];
              productosConsumo.push({ producto: botella, cantidad: 1 });
              totalConsumo += botella.precioBotella || botella.precio || 0;
            } else if (vinos.length > 0) {
              const vino = vinos[Math.floor(Math.random() * vinos.length)];
              productosConsumo.push({ producto: vino, cantidad: 1 });
              totalConsumo += vino.precioBotella || vino.precio || 0;
            }
          } else if (postres.length > 0 && Math.random() < 0.5) {
            const postre = postres[Math.floor(Math.random() * postres.length)];
            productosConsumo.push({ producto: postre, cantidad: 1 });
            totalConsumo += postre.precio || 0;
          }
        }

        if (productosConsumo.length === 0) continue;

        // Calcular puntos (1 punto por cada dólar, redondeado)
        const puntosGanados = Math.round(totalConsumo);
        puntosAcumulados += puntosGanados;

        // Crear el consumo
        const fechaConsumo = generarFechaAleatoria(90); // Últimos 90 días

        const consumo = await prisma.consumo.create({
          data: {
            businessId: demoBusiness.id,
            clienteId: cliente.id,
            total: totalConsumo,
            puntos: puntosGanados,
            detalles: productosConsumo.map(pc => ({
              nombre: pc.producto.nombre,
              cantidad: pc.cantidad,
              precio: pc.producto.precio || pc.producto.precioBotella || 0,
            })),
            fecha: fechaConsumo,
            metodoPago: ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'][Math.floor(Math.random() * 3)],
          },
        });

        numeroConsumos++;
        totalConsumosCreados++;
      }

      // Actualizar puntos y nivel del cliente
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          puntos: puntosAcumulados,
          puntosAcumulados: puntosAcumulados,
          totalVisitas: numeroConsumos,
        },
      });

      const nivelFinal = obtenerNivelTarjeta(puntosAcumulados);
      console.log(`   ✅ Cliente creado con ${numeroConsumos} consumos`);
      console.log(`   🏆 Nivel estimado: ${nivelFinal} (${puntosAcumulados} puntos)`);
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log('\n═══════════════════════════════════════');
    console.log('✅ DATOS DEMO CREADOS EXITOSAMENTE');
    console.log('═══════════════════════════════════════');
    
    const resumenNiveles = await prisma.cliente.groupBy({
      by: ['nivelTarjeta'],
      where: { businessId: demoBusiness.id },
      _count: true,
    });

    console.log(`\n📊 RESUMEN:`);
    console.log(`- Negocio: ${demoBusiness.name}`);
    console.log(`- Total clientes creados: ${totalClientesCreados}`);
    console.log(`- Total consumos generados: ${totalConsumosCreados}`);
    console.log(`\n🏆 Análisis de niveles estimados (basado en puntos):`);
    
    // Contar niveles manualmente
    const clientes = await prisma.cliente.findMany({
      where: { businessId: demoBusiness.id },
      select: { puntos: true },
    });

    const niveles = {
      PLATINO: clientes.filter(c => c.puntos >= 1000).length,
      DIAMANTE: clientes.filter(c => c.puntos >= 500 && c.puntos < 1000).length,
      ORO: clientes.filter(c => c.puntos >= 250 && c.puntos < 500).length,
      PLATA: clientes.filter(c => c.puntos >= 100 && c.puntos < 250).length,
      BRONCE: clientes.filter(c => c.puntos < 100).length,
    };

    const totalClientes = clientes.length;
    const nivelesList = [
      { nivel: 'PLATINO', count: niveles.PLATINO, emoji: '💎' },
      { nivel: 'DIAMANTE', count: niveles.DIAMANTE, emoji: '💠' },
      { nivel: 'ORO', count: niveles.ORO, emoji: '⭐' },
      { nivel: 'PLATA', count: niveles.PLATA, emoji: '🥈' },
      { nivel: 'BRONCE', count: niveles.BRONCE, emoji: '🥉' },
    ];

    for (const nivel of nivelesList) {
      if (nivel.count > 0) {
        console.log(`   ${nivel.emoji} ${nivel.nivel}: ${nivel.count} clientes (${Math.round(nivel.count / totalClientes * 100)}%)`);
      }
    }

    const totalPuntos = await prisma.cliente.aggregate({
      where: { businessId: demoBusiness.id },
      _sum: { puntos: true },
      _avg: { puntos: true },
    });

    const totalConsumoValor = await prisma.consumo.aggregate({
      where: { businessId: demoBusiness.id },
      _sum: { total: true },
      _avg: { total: true },
    });

    console.log(`\n💰 Estadísticas:`);
    console.log(`   - Total puntos distribuidos: ${totalPuntos._sum.puntos || 0}`);
    console.log(`   - Promedio puntos por cliente: ${Math.round(totalPuntos._avg.puntos || 0)}`);
    console.log(`   - Valor total consumos: $${(totalConsumoValor._sum.total || 0).toFixed(2)}`);
    console.log(`   - Ticket promedio: $${(totalConsumoValor._avg.total || 0).toFixed(2)}`);
    console.log(`\n🎉 ¡Dashboard listo para mostrar con datos reales!`);

  } catch (error) {
    console.error('❌ Error creando datos demo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
crearClientesYConsumos()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  });
