const { PrismaClient } = require('@prisma/client');

// URL de prueba
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_XcL6eWBCMz9b@ep-floral-morning-ad47ojau-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  try {
    console.log('🔄 Intentando conectar a Neon...');
    console.log('📍 Host: ep-floral-morning-ad47ojau-pooler.c-2.us-east-1.aws.neon.tech');
    
    await prisma.$connect();
    console.log('✅ ¡Conexión EXITOSA!');
    
    const count = await prisma.user.count();
    console.log(`✅ Usuarios en BD: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR DE CONEXIÓN:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 SOLUCIÓN:');
      console.error('   1. Ve a https://console.neon.tech');
      console.error('   2. Selecciona tu proyecto');
      console.error('   3. Ve a "Settings" → "Reset password"');
      console.error('   4. Copia la NUEVA connection string');
      console.error('   5. Actualiza tu archivo .env');
    }
    
    process.exit(1);
  }
}

main();
