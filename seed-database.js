/**
 * 🔧 Seed: Poblar base de datos con datos iniciales
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 INICIANDO SEED DE LA BASE DE DATOS...\n');

    // 1. Crear business principal
    console.log('🏢 Creando business...');
    const business = await prisma.business.upsert({
      where: { slug: 'jorge' },
      update: {},
      create: {
        slug: 'jorge',
        subdomain: 'jorge',
        name: 'jorge - Business Management',
        isActive: true,
      }
    });
    console.log(`✅ Business creado: ${business.name} (ID: ${business.id})\n`);

    // 2. Crear superadmin
    console.log('👤 Creando superadmin...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superadmin = await prisma.user.upsert({
      where: { email: 'jorge@gmail.com' },
      update: {},
      create: {
        name: 'jorge',
        email: 'jorge@gmail.com',
        passwordHash: hashedPassword,
        role: 'superadmin',
        businessId: business.id,
        isActive: true,
        permissions: ['read', 'write', 'delete', 'admin']
      }
    });
    console.log(`✅ Superadmin creado: ${superadmin.name} (${superadmin.email})\n`);

    // 3. Crear cliente de prueba "yoyo"
    console.log('👥 Creando cliente yoyo...');
    const cliente = await prisma.cliente.upsert({
      where: { 
        cedula_businessId: { 
          cedula: '12345678',
          businessId: business.id
        }
      },
      update: {},
      create: {
        nombre: 'yoyo',
        cedula: '12345678',
        correo: 'yoyo@test.com',
        telefono: '555-1234',
        businessId: business.id,
        puntos: 100,
        puntosAcumulados: 100,
        totalVisitas: 1,
        totalGastado: 46.52,
      }
    });
    console.log(`✅ Cliente creado: ${cliente.nombre} (${cliente.cedula})\n`);

    // 4. Crear consumo de prueba
    console.log('🛒 Creando consumo de prueba...');
    const consumo = await prisma.consumo.create({
      data: {
        businessId: business.id,
        clienteId: cliente.id,
        productos: [
          {
            name: 'Producto Test',
            price: 46.52,
            quantity: 1
          }
        ],
        total: 46.52,
        puntos: 47,
        pagado: true,
        metodoPago: 'efectivo',
        registeredAt: new Date(),
        paidAt: new Date(),
      }
    });
    console.log(`✅ Consumo creado: $${consumo.total} (ID: ${consumo.id})\n`);

    // 5. Crear metas de negocio
    console.log('🎯 Creando metas de negocio...');
    await prisma.businessGoals.upsert({
      where: { businessId: business.id },
      update: {},
      create: {
        businessId: business.id,
        targetRevenueDaily: 200,
        targetRevenueWeekly: 1400,
        targetRevenueMonthly: 6000,
        targetClientsDaily: 10,
        targetClientsWeekly: 70,
        targetClientsMonthly: 300,
        targetTransactionsDaily: 15,
        targetTransactionsWeekly: 105,
        targetTransactionsMonthly: 450,
        targetTicketAverage: 25,
        targetRetentionRate: 75,
        targetConversionRate: 80,
        targetTopClient: 200,
        targetActiveClients: 50,
      }
    });
    console.log(`✅ Metas de negocio creadas\n`);

    console.log('🎉 SEED COMPLETADO EXITOSAMENTE!');
    console.log('\n📋 DATOS CREADOS:');
    console.log(`- Business: ${business.name}`);
    console.log(`- Superadmin: ${superadmin.email} (password: admin123)`);
    console.log(`- Cliente: ${cliente.nombre} (${cliente.cedula})`);
    console.log(`- Consumo: $${consumo.total}`);
    console.log('\n🚀 El dashboard debería mostrar datos ahora!');

  } catch (error) {
    console.error('💥 Error en seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
