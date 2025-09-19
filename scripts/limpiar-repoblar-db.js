const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarYRepoblarDB() {
  console.log('🧹 LIMPIEZA Y REPOBLACIÓN DE BASE DE DATOS');
  console.log('==========================================\n');

  try {
    // 1. Limpiar todas las tablas en orden correcto (respetando foreign keys)
    console.log('🗑️ Limpiando base de datos...');
    
    // Eliminar en orden para evitar violaciones de FK
    await prisma.emailLog.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.businessGoals.deleteMany();
    await prisma.user.deleteMany();
    await prisma.cliente.deleteMany();
    await prisma.consumo.deleteMany();
    await prisma.location.deleteMany();
    await prisma.business.deleteMany();
    
    console.log('✅ Base de datos limpiada');

    // 2. Crear businesses de prueba
    console.log('\n🏗️ Creando businesses de prueba...');
    
    const businesses = [
      {
        id: 'cafe-central',
        name: 'Café Central',
        slug: 'cafe-central',
        subdomain: 'cafe-central',
        subscriptionPlan: 'PRO',
        isActive: true,
        settings: {
          theme: 'coffee',
          primaryColor: '#8B4513',
          businessType: 'cafe'
        }
      },
      {
        id: 'pizzeria-mario',
        name: 'Pizzería Mario',
        slug: 'pizzeria-mario', 
        subdomain: 'pizzeria-mario',
        subscriptionPlan: 'BASIC',
        isActive: true,
        settings: {
          theme: 'italian',
          primaryColor: '#228B22',
          businessType: 'restaurant'
        }
      },
      {
        id: 'panaderia-sofia',
        name: 'Panadería Sofía',
        slug: 'panaderia-sofia',
        subdomain: 'panaderia-sofia', 
        subscriptionPlan: 'BASIC',
        isActive: true,
        settings: {
          theme: 'bakery',
          primaryColor: '#D2691E',
          businessType: 'bakery'
        }
      }
    ];

    const createdBusinesses = [];
    for (const businessData of businesses) {
      const business = await prisma.business.create({
        data: businessData
      });
      createdBusinesses.push(business);
      console.log(`✅ Business creado: ${business.name} (${business.id})`);

      // Crear admin para cada business
      const admin = await prisma.user.create({
        data: {
          businessId: business.id,
          email: `admin@${business.subdomain}.com`,
          passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewtsP4F4/FhDjNI2', // "password123"
          name: `Admin ${business.name}`,
          role: 'SUPERADMIN',
          isActive: true,
        },
      });
      console.log(`👤 Admin creado: ${admin.name} (${admin.email})`);

      // Crear location
      await prisma.location.create({
        data: {
          businessId: business.id,
          name: `${business.name} - Principal`,
        },
      });

      // Crear business goals
      await prisma.businessGoals.create({
        data: {
          businessId: business.id,
        },
      });
    }

    console.log('\n📊 Resumen final:');
    console.log(`✅ ${createdBusinesses.length} businesses creados`);
    console.log(`✅ ${createdBusinesses.length} admins creados`);
    console.log(`✅ ${createdBusinesses.length} locations creadas`);
    
    console.log('\n🌐 URLs disponibles:');
    createdBusinesses.forEach(business => {
      console.log(`  📍 ${business.subdomain}.localhost:3000 → ${business.name}`);
      console.log(`  🔧 ${business.subdomain}.localhost:3000/admin → Panel admin`);
    });

    console.log('\n🔑 Credenciales de acceso:');
    createdBusinesses.forEach(business => {
      console.log(`  📧 admin@${business.subdomain}.com`);
      console.log(`  🔒 password123`);
    });

  } catch (error) {
    console.error('❌ Error en limpieza/repoblación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  limpiarYRepoblarDB()
    .then(() => {
      console.log('\n🎉 LIMPIEZA Y REPOBLACIÓN COMPLETADA');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = limpiarYRepoblarDB;
