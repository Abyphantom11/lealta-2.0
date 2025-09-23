/**
 * 🚀 CREAR USUARIO DE PRUEBA PARA LOGIN
 * 
 * Script para crear un usuario administrador en producción
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Verificando conexión a base de datos...');
    
    // Test de conexión
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos');
    
    // Verificar si ya existe el usuario
    const existingUser = await prisma.user.findFirst({
      where: { email: 'arepa@gmail.com' }
    });
    
    if (existingUser) {
      console.log('✅ Usuario arepa@gmail.com ya existe');
      console.log('- ID:', existingUser.id);
      console.log('- Role:', existingUser.role);
      console.log('- Business ID:', existingUser.businessId);
      return;
    }
    
    // Crear hash de contraseña
    const passwordHash = await bcrypt.hash('123456', 12);
    
    // Crear business si no existe
    let business = await prisma.business.findFirst();
    if (!business) {
      business = await prisma.business.create({
        data: {
          name: 'Lealta Demo',
          slug: 'demo',
          email: 'demo@lealta.app',
          phone: '555-0123',
          address: 'Demo Address',
          plan: 'PRO'
        }
      });
      console.log('✅ Business demo creado');
    }
    
    // Crear usuario administrador
    const user = await prisma.user.create({
      data: {
        email: 'arepa@gmail.com',
        passwordHash,
        name: 'Administrador Demo',
        role: 'SUPERADMIN',
        businessId: business.id
      }
    });
    
    console.log('✅ Usuario creado exitosamente:');
    console.log('- Email: arepa@gmail.com');
    console.log('- Password: 123456');
    console.log('- Role: SUPERADMIN');
    console.log('- ID:', user.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
