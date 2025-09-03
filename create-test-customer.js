// Script para crear un cliente de prueba
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestCustomer() {
  try {
    console.log('Creando cliente de prueba...');

    // Obtener el business existente
    const business = await prisma.business.findFirst();
    
    if (!business) {
      console.log('❌ No se encontró un negocio. Ejecuta primero init-db.js');
      return;
    }

    // Crear cliente de prueba
    const cliente = await prisma.cliente.create({
      data: {
        cedula: '12345678',
        nombre: 'Cliente de Prueba',
        correo: 'cliente@test.com',
        telefono: '123456789',
        puntos: 50,
        businessId: business.id,
      }
    });

    console.log('✅ Cliente de prueba creado exitosamente:');
    console.log(`Cédula: ${cliente.cedula}`);
    console.log(`Nombre: ${cliente.nombre}`);
    console.log(`Puntos iniciales: ${cliente.puntos}`);
    console.log('📝 Usa esta cédula en el módulo staff: 12345678');

  } catch (error) {
    console.error('❌ Error creando cliente:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestCustomer();
