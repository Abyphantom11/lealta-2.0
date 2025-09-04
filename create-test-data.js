import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🔧 Creando datos de prueba...');

  try {
    // Obtener el business y admin
    const business = await prisma.business.findFirst();
    const admin = await prisma.user.findFirst();
    
    if (!business || !admin) {
      console.error('❌ No se encontró business o admin');
      return;
    }

    // Crear clientes de prueba
    const cliente1 = await prisma.cliente.create({
      data: {
        businessId: business.id,
        nombre: 'Juan Pérez',
        cedula: '1234567890',
        telefono: '0987654321',
        correo: 'juan@email.com',
        puntos: 0,
      }
    });

    const cliente2 = await prisma.cliente.create({
      data: {
        businessId: business.id,
        nombre: 'María García',
        cedula: '0987654321',
        telefono: '0123456789',
        correo: 'maria@email.com',
        puntos: 0,
      }
    });

    console.log('✅ Clientes creados:', [cliente1.nombre, cliente2.nombre]);

    // Crear una location por defecto
    const location = await prisma.location.create({
      data: {
        businessId: business.id,
        name: 'Sede Principal',
      }
    });

    console.log('✅ Location creada:', location.name);

    // Crear consumos con productos reales
    const consumoData1 = {
      clienteId: cliente1.id,
      businessId: business.id,
      locationId: location.id,
      empleadoId: admin.id,
      total: 25.50,
      puntos: 26,
      productos: {
        items: [
          { nombre: 'Café Americano', cantidad: 2, precio: 3.50 },
          { nombre: 'Croissant', cantidad: 1, precio: 4.50 },
          { nombre: 'Jugo de Naranja', cantidad: 1, precio: 5.00 },
          { nombre: 'Sandwich Club', cantidad: 1, precio: 9.00 }
        ]
      },
      ocrText: 'MANUAL: Venta de productos varios',
      registeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
    };

    const consumoData2 = {
      clienteId: cliente2.id,
      businessId: business.id,
      locationId: location.id,
      empleadoId: admin.id,
      total: 18.75,
      puntos: 19,
      productos: {
        items: [
          { nombre: 'Latte', cantidad: 1, precio: 4.75 },
          { nombre: 'Muffin de Arándanos', cantidad: 2, precio: 3.50 },
          { nombre: 'Té Verde', cantidad: 1, precio: 3.25 },
          { nombre: 'Galletas', cantidad: 1, precio: 3.75 }
        ]
      },
      ocrText: 'MANUAL: Compra matutina',
      registeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
    };

    const consumoData3 = {
      clienteId: cliente1.id,
      businessId: business.id,
      locationId: location.id,
      empleadoId: admin.id,
      total: 32.20,
      puntos: 32,
      productos: {
        items: [
          { nombre: 'Café Americano', cantidad: 1, precio: 3.50 },
          { nombre: 'Ensalada César', cantidad: 1, precio: 12.50 },
          { nombre: 'Agua Mineral', cantidad: 2, precio: 2.50 },
          { nombre: 'Postre del Día', cantidad: 1, precio: 6.20 },
          { nombre: 'Pan Tostado', cantidad: 2, precio: 2.50 }
        ]
      },
      ocrText: 'MANUAL: Almuerzo completo',
      registeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // Hace 3 horas
    };

    const consumoData4 = {
      clienteId: cliente2.id,
      businessId: business.id,
      locationId: location.id,
      empleadoId: admin.id,
      total: 15.80,
      puntos: 16,
      productos: {
        items: [
          { nombre: 'Cappuccino', cantidad: 1, precio: 4.25 },
          { nombre: 'Croissant', cantidad: 1, precio: 4.50 },
          { nombre: 'Jugo Natural', cantidad: 1, precio: 4.75 },
          { nombre: 'Yogurt con Granola', cantidad: 1, precio: 2.30 }
        ]
      },
      ocrText: 'MANUAL: Desayuno ligero',
      registeredAt: new Date(), // Ahora
    };

    // Crear todos los consumos
    const consumos = [consumoData1, consumoData2, consumoData3, consumoData4];
    
    for (const consumoData of consumos) {
      const consumo = await prisma.consumo.create({
        data: consumoData
      });
      console.log(`✅ Consumo creado: $${consumo.total} - ${consumo.productos.items?.length || 0} productos`);
    }

    // Actualizar puntos de los clientes
    await prisma.cliente.update({
      where: { id: cliente1.id },
      data: { puntos: 26 + 32 } // Suma de sus consumos
    });

    await prisma.cliente.update({
      where: { id: cliente2.id },
      data: { puntos: 19 + 16 } // Suma de sus consumos
    });

    console.log('✅ Puntos de clientes actualizados');

    // Crear metas por defecto
    await prisma.businessGoals.create({
      data: {
        businessId: business.id,
        // Las demás propiedades usan los valores por defecto del schema
      }
    });

    console.log('✅ Metas por defecto creadas');

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('📊 Resumen:');
    console.log('- 2 clientes con transacciones');
    console.log('- 4 consumos con productos variados');
    console.log('- Total ingresos: $92.25');
    console.log('- 12 tipos de productos diferentes');
    console.log('- Metas configurables inicializadas');

  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
