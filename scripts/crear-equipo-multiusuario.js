const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function crearEquipoMultiusuario() {
  console.log('👥 CREANDO EQUIPO MULTI-USUARIO PARA DEMO RESTAURANT');
  console.log('=====================================================');
  
  try {
    // Buscar el business Demo Restaurant
    const demoRestaurant = await prisma.business.findUnique({
      where: { slug: "demo-restaurant" }
    });
    
    if (!demoRestaurant) {
      console.log('❌ Business Demo Restaurant no encontrado');
      return;
    }
    
    console.log(`✅ Business encontrado: ${demoRestaurant.name} (${demoRestaurant.id})`);

    // Buscar el SUPERADMIN existente para establecer la jerarquía
    const superAdmin = await prisma.user.findFirst({
      where: {
        businessId: demoRestaurant.id,
        role: 'SUPERADMIN'
      }
    });

    if (!superAdmin) {
      console.log('❌ SUPERADMIN no encontrado para establecer jerarquía');
      return;
    }

    console.log(`👑 SUPERADMIN existente: ${superAdmin.name} (${superAdmin.email})`);

    // Hash para contraseñas (demo123)
    const passwordHash = await bcrypt.hash('demo123', 10);

    // 1. CREAR MANAGER/ADMIN SECUNDARIO
    console.log('\n🏢 Creando Manager/Admin secundario...');
    const manager = await prisma.user.create({
      data: {
        businessId: demoRestaurant.id,
        email: "manager@demorestaurant.com",
        passwordHash: passwordHash,
        name: "Manager Principal",
        role: "ADMIN",
        createdBy: superAdmin.id, // Creado por el SUPERADMIN
        isActive: true,
        permissions: {
          canManageClients: true,
          canViewReports: true,
          canManageMenu: true,
          canManagePromos: true,
          canManageStaff: false // No puede gestionar otros usuarios
        }
      }
    });

    console.log(`✅ ADMIN creado: ${manager.name}`);
    console.log(`   📧 Email: ${manager.email}`);
    console.log(`   🔑 Password: demo123`);
    console.log(`   🎭 Rol: ADMIN (Gestión completa excepto usuarios)`);

    // 2. CREAR CAJERO/STAFF
    console.log('\n🏪 Creando Cajero/Staff...');
    const cajero = await prisma.user.create({
      data: {
        businessId: demoRestaurant.id,
        email: "cajero@demorestaurant.com", 
        passwordHash: passwordHash,
        name: "Cajero Principal",
        role: "STAFF",
        createdBy: superAdmin.id, // También creado por el SUPERADMIN
        isActive: true,
        permissions: {
          canRegisterConsumos: true,
          canViewClients: true,
          canRegisterClients: true,
          canViewMenu: true,
          canManageMenu: false,
          canViewReports: false
        }
      }
    });

    console.log(`✅ STAFF creado: ${cajero.name}`);
    console.log(`   📧 Email: ${cajero.email}`);
    console.log(`   🔑 Password: demo123`);
    console.log(`   🎭 Rol: STAFF (Solo registro de consumos y clientes)`);

    // 3. VERIFICAR JERARQUÍA Y PERMISOS
    console.log('\n🎯 VERIFICANDO ESTRUCTURA DE EQUIPO:');
    console.log('===================================');
    
    const allUsers = await prisma.user.findMany({
      where: { businessId: demoRestaurant.id },
      orderBy: { role: 'asc' }
    });

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 ${user.email}`);
      console.log(`   🎭 ${user.role}`);
      console.log(`   👑 Creado por: ${user.createdBy ? 'SUPERADMIN' : 'Sistema'}`);
      console.log(`   🟢 Activo: ${user.isActive}`);
      console.log('');
    });

    // 4. MOSTRAR MATRIZ DE PERMISOS
    console.log('📋 MATRIZ DE PERMISOS POR ROL:');
    console.log('=============================');
    console.log('┌─────────────────────┬─────────────┬───────┬───────┐');
    console.log('│ PERMISO             │ SUPERADMIN  │ ADMIN │ STAFF │');
    console.log('├─────────────────────┼─────────────┼───────┼───────┤');
    console.log('│ Gestionar Usuarios  │     ✅      │   ❌  │   ❌  │');
    console.log('│ Gestionar Clientes  │     ✅      │   ✅  │   👁️  │');
    console.log('│ Gestionar Menú      │     ✅      │   ✅  │   👁️  │');
    console.log('│ Ver Reportes        │     ✅      │   ✅  │   ❌  │');
    console.log('│ Registro Consumos   │     ✅      │   ✅  │   ✅  │');
    console.log('│ Portal Config       │     ✅      │   ✅  │   ❌  │');
    console.log('│ Configuración       │     ✅      │   ❌  │   ❌  │');
    console.log('└─────────────────────┴─────────────┴───────┴───────┘');

    // 5. URLS DE ACCESO
    console.log('\n🌐 URLS DE ACCESO PARA CADA USUARIO:');
    console.log('===================================');
    console.log(`🔗 http://localhost:3001/demo-restaurant/admin`);
    console.log('');
    console.log('👑 SUPERADMIN:');
    console.log(`   📧 ${superAdmin.email}`);
    console.log('   🔑 [Su contraseña actual]');
    console.log('');
    console.log('🏢 MANAGER/ADMIN:');
    console.log(`   📧 ${manager.email}`);
    console.log('   🔑 demo123');
    console.log('');
    console.log('🏪 CAJERO/STAFF:');
    console.log(`   📧 ${cajero.email}`);
    console.log('   🔑 demo123');

    console.log('\n🎉 EQUIPO MULTI-USUARIO CREADO EXITOSAMENTE');
    console.log('==========================================');
    console.log('✅ 3 usuarios con roles diferenciados');
    console.log('✅ Permisos granulares por rol');
    console.log('✅ Acceso simultáneo desde diferentes PCs');
    console.log('✅ Jerarquía de seguridad mantenida');
    console.log('✅ Misma URL, diferentes credenciales');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Algunos usuarios ya existen - esto es normal');
      console.log('   Los emails deben ser únicos por business');
    } else {
      console.error('❌ Error creando equipo:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

crearEquipoMultiusuario();
