/**
 * Agregar datos de demostración al negocio existente
 * Business ID: cmgf5px5f0000eyy0elci9yds
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BUSINESS_ID = 'cmgf5px5f0000eyy0elci9yds';

//  Datos de clientes
const CLIENTES_DEMO = [
  { cedula: '12345678A', nombre: 'Carlos', apellido: 'García Ruiz', email: 'carlos.garcia@email.com', telefono: '+34 600 111 222', puntos: 8500 },
  { cedula: '23456789B', nombre: 'María', apellido: 'López Sánchez', email: 'maria.lopez@email.com', telefono: '+34 600 222 333', puntos: 15500 },
  { cedula: '34567890C', nombre: 'José', apellido: 'Martínez Torres', email: 'jose.martinez@email.com', telefono: '+34 600 333 444', puntos: 3200 },
  { cedula: '45678901D', nombre: 'Ana', apellido: 'Rodríguez Pérez', email: 'ana.rodriguez@email.com', telefono: '+34 600 444 555', puntos: 22000 },
  { cedula: '56789012E', nombre: 'Luis', apellido: 'Fernández Gómez', email: 'luis.fernandez@email.com', telefono: '+34 600 555 666', puntos: 35000 },
  { cedula: '67890123F', nombre: 'Carmen', apellido: 'Díaz Moreno', email: 'carmen.diaz@email.com', telefono: '+34 600 666 777', puntos: 12800 },
  { cedula: '78901234G', nombre: 'Pedro', apellido: 'Sánchez Ruiz', email: 'pedro.sanchez@email.com', telefono: '+34 600 777 888', puntos: 6700 },
  { cedula: '89012345H', nombre: 'Laura', apellido: 'Jiménez López', email: 'laura.jimenez@email.com', telefono: '+34 600 888 999', puntos: 18900 },
  { cedula: '90123456I', nombre: 'Miguel', apellido: 'González Martín', email: 'miguel.gonzalez@email.com', telefono: '+34 600 999 000', puntos: 4500 },
  { cedula: '01234567J', nombre: 'Isabel', apellido: 'Hernández Ramos', email: 'isabel.hernandez@email.com', telefono: '+34 611 111 222', puntos: 28500 },
];

// Productos del menú
const PRODUCTOS = [
  { nombre: 'Ensalada César', precio: 9.90 },
  { nombre: 'Sopa del Día', precio: 7.50 },
  { nombre: 'Filete de Salmón', precio: 24.90 },
  { nombre: 'Lomo de Res', precio: 28.50 },
  { nombre: 'Pasta Carbonara', precio: 16.90 },
  { nombre: 'Pizza Margherita', precio: 14.90 },
  { nombre: 'Hamburguesa Premium', precio: 15.90 },
  { nombre: 'Postre del Chef', precio: 8.90 },
  { nombre: 'Café Espresso', precio: 3.50 },
  { nombre: 'Vino Tinto (Copa)', precio: 7.50 },
];

function randomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(Math.floor(Math.random() * 5) + 18); // 18:00-23:00
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function randomFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  date.setHours(Math.floor(Math.random() * 5) + 19); // 19:00-24:00
  date.setMinutes([0, 15, 30, 45][Math.floor(Math.random() * 4)]);
  return date;
}

async function main() {
  console.log('🚀 Agregando datos de demostración...\n');

  try {
    // Verificar que exista el negocio
    const business = await prisma.business.findUnique({
      where: { id: BUSINESS_ID },
      include: { users: true, locations: true }
    });

    if (!business) {
      console.error('❌ Negocio no encontrado');
      return;
    }

    const adminUser = business.users.find(u => u.role === 'SUPERADMIN');
    const location = business.locations[0];

    if (!location) {
      console.log('📍 Creando ubicación...');
      const newLocation = await prisma.location.create({
        data: {
          businessId: BUSINESS_ID,
          name: "Sede Principal - Madrid",
        }
      });
      console.log(`✅ Ubicación creada: ${newLocation.id}\n`);
    }

    const finalLocation = location || await prisma.location.findFirst({
      where: { businessId: BUSINESS_ID }
    });

    // Crear servicio de reservas si no existe
    console.log('📋 Verificando servicio de reservas...');
    let reservationService = await prisma.reservationService.findFirst({
      where: { businessId: BUSINESS_ID }
    });

    if (!reservationService) {
      console.log('   Creando servicio de reservas...');
      reservationService = await prisma.reservationService.create({
        data: {
          businessId: BUSINESS_ID,
          name: "Reservas Restaurante",
          description: "Servicio de reservas principal",
          duration: 120, // 2 horas por defecto
          capacity: 50, // Capacidad total
          isActive: true,
        }
      });
      console.log('   ✅ Servicio creado\n');
    } else {
      console.log('   ✅ Servicio ya existe\n');
    }

    // 1. OBTENER CLIENTES EXISTENTES
    console.log(`👥 Obteniendo clientes existentes...`);
    const clientesCreados = await prisma.cliente.findMany({
      where: { businessId: BUSINESS_ID }
    });
    
    if (clientesCreados.length === 0) {
      console.log('⚠️  No hay clientes. Creando clientes...');
      for (const clienteData of CLIENTES_DEMO) {
        const cliente = await prisma.cliente.create({
          data: {
            businessId: BUSINESS_ID,
            cedula: clienteData.cedula,
            nombre: `${clienteData.nombre} ${clienteData.apellido}`,
            correo: clienteData.email,
            telefono: clienteData.telefono,
            puntos: clienteData.puntos,
            puntosAcumulados: clienteData.puntos,
            totalVisitas: Math.floor(Math.random() * 20) + 5,
            totalGastado: clienteData.puntos / 10,
          }
        });
        clientesCreados.push(cliente);
      }
    }
    console.log(`✅ ${clientesCreados.length} clientes disponibles\n`);

    // 2. CREAR CONSUMOS
    console.log(`💰 Creando consumos...`);
    let consumosCreados = 0;
    
    for (const cliente of clientesCreados) {
      // Cada cliente tendrá entre 2-6 consumos
      const numConsumos = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < numConsumos; i++) {
        // Generar 1-3 productos por consumo
        const numProductos = Math.floor(Math.random() * 3) + 1;
        const items = [];
        let total = 0;
        
        for (let j = 0; j < numProductos; j++) {
          const producto = PRODUCTOS[Math.floor(Math.random() * PRODUCTOS.length)];
          const cantidad = Math.floor(Math.random() * 2) + 1;
          items.push({
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad
          });
          total += producto.precio * cantidad;
        }
        
        const puntosGanados = Math.floor(total * 10); // 10 puntos por euro
        
        await prisma.consumo.create({
          data: {
            businessId: BUSINESS_ID,
            locationId: finalLocation.id,
            clienteId: cliente.id,
            empleadoId: adminUser.id,
            total: total, // Campo requerido
            productos: items, // Campo requerido
            puntos: puntosGanados,
            registeredAt: randomDate(60),
            pagado: true,
            metodoPago: ['efectivo', 'tarjeta', 'transferencia'][Math.floor(Math.random() * 3)],
          }
        });
        
        consumosCreados++;
      }
    }
    console.log(`✅ ${consumosCreados} consumos creados\n`);

    // 3. CREAR RESERVAS (futuras y pasadas)
    console.log(`📅 Creando reservas...`);
    const numReservas = 12;
    let reservasCreadas = 0;
    
    for (let i = 0; i < numReservas; i++) {
      const cliente = clientesCreados[Math.floor(Math.random() * clientesCreados.length)];
      const esFutura = Math.random() > 0.3; // 70% futuras
      const fecha = esFutura ? randomFutureDate(30) : randomDate(30);
      const numPersonas = Math.floor(Math.random() * 6) + 2;
      
      // Estado basado en si es futura o pasada
      let estado;
      if (esFutura) {
        estado = Math.random() > 0.2 ? 'CONFIRMED' : 'PENDING';
      } else {
        const rand = Math.random();
        if (rand > 0.8) estado = 'COMPLETED';
        else if (rand > 0.6) estado = 'CANCELLED';
        else if (rand > 0.4) estado = 'NO_SHOW';
        else estado = 'COMPLETED';
      }
      
      const notas = estado === 'CONFIRMED' ? 'Confirmada telefónicamente' :
                   estado === 'PENDING' ? 'Pendiente de confirmación' :
                   estado === 'COMPLETED' ? 'Completada sin incidencias' :
                   estado === 'CANCELLED' ? 'Cliente canceló' :
                   'No se presentó';
      
      await prisma.reservation.create({
        data: {
          businessId: BUSINESS_ID,
          service: { connect: { id: reservationService.id } }, // Conectar al servicio
          clienteId: cliente.id,
          reservationNumber: `RES-${Date.now()}-${i}`,
          customerName: cliente.nombre,
          customerEmail: cliente.correo,
          customerPhone: cliente.telefono,
          date: fecha,
          reservedAt: new Date(),
          guestCount: numPersonas,
          partySize: numPersonas,
          status: estado,
          notes: notas,
          specialRequests: numPersonas > 6 ? 'Mesa grande preferentemente' : null,
        }
      });
      
      reservasCreadas++;
    }
    console.log(`✅ ${reservasCreadas} reservas creadas\n`);

    // RESUMEN
    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ ¡DATOS DE DEMO AGREGADOS! ✨');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`📊 RESUMEN:\n`);
    console.log(`👥 Clientes: ${clientesCreados.length}`);
    console.log(`💰 Consumos: ${consumosCreados}`);
    console.log(`📅 Reservas: ${reservasCreadas}\n`);
    
    console.log('🎯 DISTRIBUCIÓN DE CLIENTES POR NIVEL:\n');
    const bronce = clientesCreados.filter(c => c.puntosAcumulados < 5000).length;
    const plata = clientesCreados.filter(c => c.puntosAcumulados >= 5000 && c.puntosAcumulados < 15000).length;
    const oro = clientesCreados.filter(c => c.puntosAcumulados >= 15000 && c.puntosAcumulados < 30000).length;
    const platino = clientesCreados.filter(c => c.puntosAcumulados >= 30000).length;
    
    console.log(`🥉 Bronce: ${bronce} clientes`);
    console.log(`🥈 Plata: ${plata} clientes`);
    console.log(`🥇 Oro: ${oro} clientes`);
    console.log(`💎 Platino: ${platino} clientes\n`);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 LISTO PARA CAPTURAS:\n');
    console.log(`1. Admin Dashboard:`);
    console.log(`   http://localhost:3001/admin/login`);
    console.log(`   → Ver estadísticas, métricas, gráficos\n`);
    console.log(`2. Portal Cliente:`);
    console.log(`   http://localhost:3001/${BUSINESS_ID}`);
    console.log(`   → Ver tarjetas, promociones, historial\n`);
    console.log(`3. Staff POS:`);
    console.log(`   http://localhost:3001/${BUSINESS_ID}/staff`);
    console.log(`   → Registrar consumos, gestionar reservas\n`);
    console.log('═══════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error);
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
