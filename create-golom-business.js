const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createGolomBusiness() {
  try {
    console.log('🏢 Creando business "golom"...\n');
    
    const business = await prisma.business.create({
      data: {
        id: 'cmgau76qc0000ey1gooftzlqr', // Usar el mismo ID que tenías antes
        name: 'Golom',
        slug: 'golom',
        subdomain: 'golom',
        email: 'admin@golom.com',
        phone: '+507 1234-5678',
      }
    });

    console.log('✅ Business creado exitosamente:');
    console.log('   Nombre:', business.name);
    console.log('   ID:', business.id);
    console.log('   Slug:', business.slug);
    console.log('\n🎉 Ahora puedes iniciar sesión y crear reservas!');

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ El business "golom" ya existe en la base de datos');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createGolomBusiness();
