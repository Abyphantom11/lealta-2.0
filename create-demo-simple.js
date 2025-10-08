/**
 * Script simplificado para crear un negocio demo
 * Usa las estructuras del schema actual
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando creación de negocio demo simplificado...\n');

  try {
    // 1. CREAR NEGOCIO
    console.log('🏢 Creando negocio...');
    const business = await prisma.business.create({
      data: {
        name: "La Casa del Sabor - Demo",
        slug: "casa-sabor-demo",
        subdomain: "casasabordemo",
        subscriptionPlan: "PRO",
        isActive: true,
        clientTheme: "elegante",
        qrMostrarLogo: true,
        qrMensajeBienvenida: "¡Bienvenido!",
        settings: {
          email: "demo@casadelsabor.com",
          phone: "+34 911 234 567",
          address: "Gran Vía, 28, Madrid",
        },
      }
    });
    console.log(`✅ Negocio creado: ${business.name}`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Subdomain: ${business.subdomain}\n`);

    // 2. CREAR ADMIN
    console.log('👤 Creando admin...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash("Demo2024!", 10);
    
    const admin = await prisma.user.create({
      data: {
        businessId: business.id,
        email: "admin@casadelsabor.com",
        passwordHash: hashedPassword,
        name: "Admin Demo",
        role: "SUPERADMIN",
        isActive: true,
      }
    });
    console.log(`✅ Admin creado: ${admin.email}`);
    console.log(`   Password: Demo2024!\n`);

    // 3. CREAR UBICACIÓN
    console.log('📍 Creando ubicación...');
    const location = await prisma.location.create({
      data: {
        businessId: business.id,
        name: "Sede Principal - Madrid",
      }
    });
    console.log(`✅ Ubicación creada\n`);

    // 4. CREAR TARJETAS DE FIDELIDAD
    console.log('🎴 Creando tarjetas...');
    
    const tarjetaBronce = await prisma.configuracionTarjeta.create({
      data: {
        businessId: business.id,
        nivel: "BRONCE",
        nombre: "Bronce",
        puntosMinimos: 0,
        puntosMaximos: 4999,
        descuento: 5,
        color: "#CD7F32",
        beneficios: ["5% descuento", "Puntos x1"],
        activa: true,
      }
    });

    await prisma.configuracionTarjeta.create({
      data: {
        businessId: business.id,
        nivel: "PLATA",
        nombre: "Plata",
        puntosMinimos: 5000,
        puntosMaximos: 14999,
        descuento: 10,
        color: "#C0C0C0",
        beneficios: ["10% descuento", "Puntos x1.5"],
        activa: true,
      }
    });

    await prisma.configuracionTarjeta.create({
      data: {
        businessId: business.id,
        nivel: "ORO",
        nombre: "Oro",
        puntosMinimos: 15000,
        puntosMaximos: 29999,
        descuento: 15,
        color: "#FFD700",
        beneficios: ["15% descuento", "Puntos x2", "Eventos exclusivos"],
        activa: true,
      }
    });

    await prisma.configuracionTarjeta.create({
      data: {
        businessId: business.id,
        nivel: "PLATINO",
        nombre: "Platino",
        puntosMinimos: 30000,
        puntosMaximos: 999999,
        descuento: 20,
        color: "#E5E4E2",
        beneficios: ["20% descuento", "Puntos x3", "Mesa VIP"],
        activa: true,
      }
    });

    console.log(`✅ 4 tarjetas creadas\n`);

    // RESUMEN
    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ ¡NEGOCIO DEMO CREADO! ✨');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log(`📊 INFORMACIÓN:\n`);
    console.log(`🏢 Negocio: ${business.name}`);
    console.log(`   └─ ID: ${business.id}`);
    console.log(`   └─ Subdomain: ${business.subdomain}\n`);
    
    console.log(`👤 Admin:`);
    console.log(`   └─ Email: admin@casadelsabor.com`);
    console.log(`   └─ Password: Demo2024!\n`);
    
    console.log(`🎴 Tarjetas: 4 niveles configurados\n`);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 ACCESO:\n');
    console.log(`Admin Dashboard:`);
    console.log(`   http://localhost:3001/admin/login`);
    console.log(`   Email: admin@casadelsabor.com`);
    console.log(`   Pass: Demo2024!\n`);
    console.log(`Portal Cliente:`);
    console.log(`   http://localhost:3001/${business.id}\n`);
    console.log(`Staff (POS):`);
    console.log(`   http://localhost:3001/${business.id}/staff\n`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Inicia sesión como admin');
    console.log('   2. Ve a la sección de Clientes y registra algunos');
    console.log('   3. Ve a Staff y registra consumos');
    console.log('   4. Ve a Reservas y crea algunas reservas');
    console.log('   5. Toma capturas de pantalla para el demo\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.log('\n💡 El negocio ya existe. Elimínalo primero o usa otro nombre.\n');
    }
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
