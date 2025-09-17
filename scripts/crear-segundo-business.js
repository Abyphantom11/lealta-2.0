const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function crearSegundoBusiness() {
  console.log('🏗️ CREANDO SEGUNDO BUSINESS PARA PRUEBA DE SEPARACIÓN');
  console.log('=====================================================');
  
  try {
    // 1. Crear segundo business "Cafe Central"
    console.log('\n📊 Creando Business "Cafe Central"...');
    const cafeCentral = await prisma.business.create({
      data: {
        name: "Cafe Central",
        slug: "cafe-central",
        subdomain: "cafe-central",
        subscriptionPlan: "BASIC",
        isActive: true,
        settings: {
          theme: "warm",
          primaryColor: "#8B4513",
          businessType: "cafe"
        }
      }
    });
    console.log(`✅ Business creado: ${cafeCentral.name} (ID: ${cafeCentral.id})`);

    // 2. Crear usuarios para Cafe Central
    console.log('\n👥 Creando usuarios para Cafe Central...');
    
    const adminCafe = await prisma.user.create({
      data: {
        businessId: cafeCentral.id,
        email: "admin@cafecentral.com",
        passwordHash: "$2b$10$hash123", // Hash dummy
        name: "Maria Rodriguez",
        role: "SUPERADMIN",
        isActive: true
      }
    });
    console.log(`✅ SUPERADMIN creado: ${adminCafe.name}`);

    const staffCafe = await prisma.user.create({
      data: {
        businessId: cafeCentral.id,
        email: "barista@cafecentral.com", 
        passwordHash: "$2b$10$hash456",
        name: "Carlos Mendez",
        role: "STAFF",
        createdBy: adminCafe.id,
        isActive: true
      }
    });
    console.log(`✅ STAFF creado: ${staffCafe.name}`);

    // 3. Crear categorías de menú para Cafe Central
    console.log('\n📋 Creando categorías de menú para Cafe Central...');
    
    const categoriaBebidas = await prisma.menuCategory.create({
      data: {
        businessId: cafeCentral.id,
        nombre: "Bebidas Calientes",
        descripcion: "Cafés, tés y chocolates",
        orden: 1,
        activo: true,
        icono: "coffee"
      }
    });

    const categoriaPostres = await prisma.menuCategory.create({
      data: {
        businessId: cafeCentral.id,
        nombre: "Postres Artesanales", 
        descripcion: "Pasteles y dulces de la casa",
        orden: 2,
        activo: true,
        icono: "cake"
      }
    });

    console.log(`✅ Categorías creadas: ${categoriaBebidas.nombre}, ${categoriaPostres.nombre}`);

    // 4. Crear productos para cada categoría
    console.log('\n🍰 Creando productos para Cafe Central...');
    
    const productos = await prisma.menuProduct.createMany({
      data: [
        {
          categoryId: categoriaBebidas.id,
          nombre: "Cappuccino Artesanal",
          descripcion: "Espresso con leche vaporizada y arte latte",
          precio: 4.50,
          tipoProducto: "simple",
          disponible: true,
          destacado: true,
          orden: 1
        },
        {
          categoryId: categoriaBebidas.id,
          nombre: "Latte Vainilla",
          descripcion: "Café con leche y sirope de vainilla",
          precio: 5.00,
          tipoProducto: "simple", 
          disponible: true,
          orden: 2
        },
        {
          categoryId: categoriaPostres.id,
          nombre: "Cheesecake de Frutos Rojos",
          descripcion: "Cremoso cheesecake con salsa de frutos del bosque",
          precio: 6.50,
          tipoProducto: "simple",
          disponible: true,
          destacado: true,
          orden: 1
        }
      ]
    });
    console.log(`✅ ${productos.count} productos creados`);

    // 5. Crear clientes para Cafe Central
    console.log('\n🛒 Creando clientes para Cafe Central...');
    
    const clienteCafe1 = await prisma.cliente.create({
      data: {
        businessId: cafeCentral.id,
        cedula: "87654321", // Diferente cédula para evitar conflicto
        nombre: "Ana Garcia",
        correo: "ana@email.com",
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
        cedula: "56789123", // Otra cédula diferente
        nombre: "Roberto Silva",
        correo: "roberto@email.com",
        telefono: "555-5678",
        puntos: 200,
        puntosAcumulados: 600,
        totalVisitas: 8,
        totalGastado: 156.00
      }
    });

    console.log(`✅ Clientes creados: ${clienteCafe1.nombre}, ${clienteCafe2.nombre}`);

    // 6. Crear Location para Cafe Central
    console.log('\n📍 Creando ubicación para Cafe Central...');
    const locationCafe = await prisma.location.create({
      data: {
        businessId: cafeCentral.id,
        name: "Cafe Central - Centro"
      }
    });
    console.log(`✅ Ubicación creada: ${locationCafe.name}`);

    console.log('\n🎉 SEGUNDO BUSINESS CREADO EXITOSAMENTE');
    console.log('=====================================');
    console.log(`Business ID: ${cafeCentral.id}`);
    console.log(`Usuarios: 2 (1 admin, 1 staff)`);
    console.log(`Categorías: 2`);
    console.log(`Productos: 3`);
    console.log(`Clientes: 2`);
    console.log(`Ubicaciones: 1`);

  } catch (error) {
    console.error('❌ Error creando segundo business:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearSegundoBusiness();
