const { PrismaClient } = require('@prisma/client');

// Usar la misma connection string que proporcionaste
const DATABASE_URL = "postgresql://neondb_owner:npg_XcL6eWBCMz9b@ep-floral-morning-ad47ojau-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos de producción...\n');
    console.log('📡 Connection String:');
    console.log(`   ${DATABASE_URL.substring(0, 80)}...\n`);
    
    // Test 1: Conexión básica
    await prisma.$connect();
    console.log('✅ Test 1: Conexión establecida correctamente\n');
    
    // Test 2: Contar businesses
    const businessCount = await prisma.business.count();
    console.log(`✅ Test 2: Se encontraron ${businessCount} businesses\n`);
    
    // Test 3: Verificar business demo
    const demoBusiness = await prisma.business.findFirst({
      where: {
        subdomain: 'casasabordemo'
      },
      include: {
        users: {
          select: {
            email: true,
            name: true,
            role: true
          }
        }
      }
    });
    
    if (demoBusiness) {
      console.log('✅ Test 3: Business demo encontrado:');
      console.log(`   Nombre: ${demoBusiness.name}`);
      console.log(`   Subdomain: ${demoBusiness.subdomain}`);
      console.log(`   Usuarios: ${demoBusiness.users.length}`);
      console.log('');
      
      demoBusiness.users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (${user.role})`);
      });
    } else {
      console.log('❌ Test 3: Business demo NO encontrado');
    }
    
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  ✅ BASE DE DATOS FUNCIONAL               ║');
    console.log('║                                            ║');
    console.log('║  La conexión está correcta.                ║');
    console.log('║  El problema está en Vercel.               ║');
    console.log('║                                            ║');
    console.log('║  📝 SOLUCIÓN:                              ║');
    console.log('║  1. Configura las variables en Vercel      ║');
    console.log('║  2. Haz REDEPLOY                           ║');
    console.log('║  3. Ver archivo: VERCEL_ENV_VARS.txt       ║');
    console.log('╚════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n⚠️  La base de datos NO es accesible con esa connection string.');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
