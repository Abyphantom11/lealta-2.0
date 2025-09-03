const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createStaffUser() {
  try {
    console.log('Creando usuario STAFF...');

    // Obtener el business existente
    const business = await prisma.business.findFirst();
    if (!business) {
      console.log('❌ No hay business en la base de datos');
      return;
    }

    // Hash de la password
    const hashedPassword = await bcrypt.hash('staff123', 12);

    // Crear usuario STAFF
    const staffUser = await prisma.user.create({
      data: {
        email: 'staff@lealta.com',
        passwordHash: hashedPassword,
        name: 'Usuario Staff',
        role: 'STAFF',
        businessId: business.id,
        isActive: true,
      },
    });

    console.log('✅ Usuario STAFF creado exitosamente:');
    console.log(`Email: ${staffUser.email}`);
    console.log(`Password: staff123`);
    console.log(`Role: ${staffUser.role}`);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Ya existe un usuario con ese email');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createStaffUser();
