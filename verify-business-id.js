// Script para verificar que el businessId existe en la base de datos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BUSINESS_ID = "cmfr2y0ia0000eyvw7ef3k20u";

async function verificarBusiness() {
  try {
    console.log('🔍 Verificando business ID:', BUSINESS_ID);
    
    const business = await prisma.business.findUnique({
      where: { id: BUSINESS_ID },
      select: {
        id: true,
        name: true,
        clientTheme: true,
        createdAt: true
      }
    });
    
    if (business) {
      console.log('✅ Business encontrado:');
      console.log('   ID:', business.id);
      console.log('   Nombre:', business.name);
      console.log('   Tema:', business.clientTheme || 'moderno (default)');
      console.log('   Creado:', business.createdAt);
    } else {
      console.log('❌ Business NO encontrado');
      console.log('\n📋 Businesses disponibles:');
      
      const allBusinesses = await prisma.business.findMany({
        select: {
          id: true,
          name: true,
          clientTheme: true
        },
        take: 10
      });
      
      allBusinesses.forEach(b => {
        console.log(`   - ${b.name} (${b.id}) - Tema: ${b.clientTheme || 'moderno'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarBusiness();
