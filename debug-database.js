/**
 * 🔍 Debug: Verificar datos en la base de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 VERIFICANDO BASE DE DATOS...\n');

    // 1. Verificar clientes
    const clientes = await prisma.cliente.findMany({
      select: {
        id: true,
        nombre: true,
        cedula: true,
        businessId: true,
        registeredAt: true,
        totalGastado: true,
        puntos: true,
      }
    });
    
    console.log(`👥 CLIENTES ENCONTRADOS: ${clientes.length}`);
    clientes.forEach((cliente, index) => {
      console.log(`  ${index + 1}. ${cliente.nombre} (${cliente.cedula}) - Business: ${cliente.businessId}`);
      console.log(`     Gastado: $${cliente.totalGastado}, Puntos: ${cliente.puntos}`);
      console.log(`     Registrado: ${cliente.registeredAt}\n`);
    });

    // 2. Verificar consumos
    const consumos = await prisma.consumo.findMany({
      include: {
        cliente: {
          select: {
            nombre: true,
            cedula: true,
          }
        }
      }
    });
    
    console.log(`🛒 CONSUMOS ENCONTRADOS: ${consumos.length}`);
    consumos.forEach((consumo, index) => {
      console.log(`  ${index + 1}. Cliente: ${consumo.cliente?.nombre} - Total: $${consumo.total}`);
      console.log(`     Business: ${consumo.businessId}, Fecha: ${consumo.registeredAt}\n`);
    });

    // 3. Verificar businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        slug: true,
        subdomain: true,
        isActive: true,
      }
    });
    
    console.log(`🏢 BUSINESSES ENCONTRADOS: ${businesses.length}`);
    businesses.forEach((business, index) => {
      console.log(`  ${index + 1}. ${business.slug} (${business.subdomain}) - ID: ${business.id}`);
      console.log(`     Activo: ${business.isActive}\n`);
    });

    // 4. Verificar usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        businessId: true,
        isActive: true,
      }
    });
    
    console.log(`👤 USUARIOS ENCONTRADOS: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Rol: ${user.role}`);
      console.log(`     Business: ${user.businessId}, Activo: ${user.isActive}\n`);
    });

  } catch (error) {
    console.error('💥 Error verificando base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
