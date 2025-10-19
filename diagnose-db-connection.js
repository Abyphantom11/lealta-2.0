// Script para diagnosticar problemas de conexión a la base de datos
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  console.log('🔍 Diagnóstico de Conexión a Base de Datos\n');
  console.log('📋 Variables de Entorno:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Definida ✅' : 'No definida ❌');
  console.log('POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL ? 'Definida ✅' : 'No definida ❌');
  
  // Mostrar URL sin contraseña
  if (process.env.DATABASE_URL) {
    const urlWithoutPassword = process.env.DATABASE_URL.replace(
      /:[^:@]+@/,
      ':****@'
    );
    console.log('URL (sin contraseña):', urlWithoutPassword);
  }

  console.log('\n🔌 Intentando conectar a la base de datos...');
  
  try {
    // Intenta una consulta simple
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexión exitosa!\n');
    
    // Verifica que las tablas existen
    console.log('📊 Verificando tablas...');
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `;
    console.log('Primeras 5 tablas:', tableCheck);
    
  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensaje:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n🔐 Solución: La contraseña es incorrecta.');
      console.error('1. Ve a https://console.neon.tech/');
      console.error('2. Selecciona tu proyecto');
      console.error('3. Copia el Connection String completo');
      console.error('4. Actualiza DATABASE_URL en .env y .env.local');
    }
    
    if (error.message.includes('timeout')) {
      console.error('\n⏱️ Solución: Timeout de conexión.');
      console.error('1. Verifica tu conexión a internet');
      console.error('2. Verifica que el host de Neon sea accesible');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
