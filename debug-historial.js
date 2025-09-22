/**
 * 🔍 SCRIPT DE DIAGNÓSTICO - PROBAR API DE HISTORIAL CLIENTE
 * 
 * Simula la misma consulta que hace /api/admin/clientes/[cedula]/historial
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function probarHistorialCliente() {
  try {
    console.log('🔍 Probando consulta de historial cliente...\n');

    const cedula = '1762075776';
    const businessId = 'cmfvlkngf0000eybk87ifx71m'; // Business de arepa
    
    console.log(`🎯 Buscando cliente con cédula: ${cedula}`);
    console.log(`🏢 En business: ${businessId}\n`);

    // Simular la misma consulta que hace la API
    const cliente = await prisma.cliente.findFirst({
      where: { 
        cedula,
        businessId: businessId // Filtrar por business del usuario
      },
      include: {
        tarjetaLealtad: true,
        consumos: {
          include: {
            empleado: {
              select: {
                name: true,
                email: true,
              },
            },
            location: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            registeredAt: 'desc',
          },
        },
      },
    });

    if (!cliente) {
      console.log('❌ Cliente no encontrado con estos filtros');
      
      // Verificar si existe sin filtro de business
      const clienteSinFiltro = await prisma.cliente.findFirst({
        where: { cedula }
      });
      
      if (clienteSinFiltro) {
        console.log(`⚠️  Cliente SÍ existe pero en business: ${clienteSinFiltro.businessId}`);
        console.log(`❌ Esperado: ${businessId}`);
        console.log(`❌ Actual: ${clienteSinFiltro.businessId}`);
      } else {
        console.log('❌ Cliente no existe en ningún business');
      }
      return;
    }

    console.log('✅ Cliente encontrado:');
    console.log(`   ID: ${cliente.id}`);
    console.log(`   Nombre: ${cliente.nombre}`);
    console.log(`   Cédula: ${cliente.cedula}`);
    console.log(`   Business: ${cliente.businessId}`);
    console.log(`   Consumos: ${cliente.consumos.length}`);

    if (cliente.consumos.length > 0) {
      console.log('\n📋 Consumos encontrados:');
      cliente.consumos.forEach((consumo, index) => {
        console.log(`  ${index + 1}. Fecha: ${consumo.registeredAt.toISOString()}`);
        console.log(`     Total: $${consumo.total}`);
        console.log(`     Puntos: ${consumo.puntos}`);
        console.log(`     Empleado: ${consumo.empleado.name}`);
        console.log(`     Business: ${consumo.businessId}`);
        console.log('     ---');
      });
    } else {
      console.log('\n❌ No se encontraron consumos para este cliente');
    }

  } catch (error) {
    console.error('❌ Error en consulta:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar prueba
probarHistorialCliente();
