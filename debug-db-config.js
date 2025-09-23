/**
 * 🔍 Debug: Verificar configuración de la base de datos
 */

console.log('🔍 VERIFICANDO CONFIGURACIÓN DE DB...\n');

// 1. Verificar variables de entorno
console.log('📋 VARIABLES DE ENTORNO:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

// 2. Verificar URL de la base de datos (sin mostrar credenciales completas)
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const urlPattern = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = dbUrl.match(urlPattern);
  
  if (match) {
    console.log('🗄️ DETALLES DE LA BASE DE DATOS:');
    console.log('Host:', match[3]);
    console.log('Puerto:', match[4]);
    console.log('Base de datos:', match[5]);
    console.log('Usuario:', match[1]);
    console.log('');
  }
}

// 3. Intentar conexión simple
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
  await prisma.$connect();
  console.log('✅ CONEXIÓN A PRISMA: EXITOSA');
  
  // Test básico
  const result = await prisma.$queryRaw`SELECT 1 as test`;
  console.log('✅ QUERY TEST: EXITOSA');
  
} catch (error) {
  console.error('❌ ERROR DE CONEXIÓN:', error.message);
} finally {
  await prisma.$disconnect();
}
