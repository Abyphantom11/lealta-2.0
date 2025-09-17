const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function agregarClientesCafe() {
  console.log('🛒 AGREGANDO CLIENTES PARA CAFE CENTRAL');
  console.log('=====================================');
  
  try {
    // Buscar el business Cafe Central
    const cafeCentral = await prisma.business.findUnique({
      where: { slug: "cafe-central" }
    });
    
    if (!cafeCentral) {
      console.log('❌ Business Cafe Central no encontrado');
      return;
    }
    
    console.log(`✅ Business encontrado: ${cafeCentral.name} (${cafeCentral.id})`);

    // Crear clientes para Cafe Central
    const clienteCafe1 = await prisma.cliente.create({
      data: {
        businessId: cafeCentral.id,
        cedula: "87654321", // Diferente a la del cliente de Demo Restaurant
        nombre: "Ana Garcia",
        correo: "ana@cafecentral.com",
        telefono: "555-1234",
        puntos: 150,
        puntosAcumulados: 350,
        totalVisitas: 5,
        totalGastado: 87.50
      }
    });

    const clienteCafe2 = await prisma.cliente.create({
      data: {
        businessId: cafeCentral.id,
        cedula: "56789123", 
        nombre: "Roberto Silva",
        correo: "roberto@cafecentral.com",
        telefono: "555-5678",
        puntos: 200,
        puntosAcumulados: 600,
        totalVisitas: 8,
        totalGastado: 156.00
      }
    });

    console.log(`✅ Cliente creado: ${clienteCafe1.nombre} (Puntos: ${clienteCafe1.puntos})`);
    console.log(`✅ Cliente creado: ${clienteCafe2.nombre} (Puntos: ${clienteCafe2.puntos})`);

    // Crear Location para Cafe Central si no existe
    const locationExistente = await prisma.location.findFirst({
      where: { businessId: cafeCentral.id }
    });

    if (!locationExistente) {
      const locationCafe = await prisma.location.create({
        data: {
          businessId: cafeCentral.id,
          name: "Cafe Central - Centro"
        }
      });
      console.log(`✅ Ubicación creada: ${locationCafe.name}`);
    }

    console.log('\n🎉 CLIENTES AGREGADOS EXITOSAMENTE');

  } catch (error) {
    console.error('❌ Error agregando clientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

agregarClientesCafe();
