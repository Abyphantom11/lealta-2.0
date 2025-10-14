// Script para verificar y crear el negocio "casa-sabor-demo"
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarYCrearNegocio() {
  console.log('🔍 Verificando negocios existentes...\n');
  
  try {
    // 1. Listar negocios existentes
    const negocios = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        subscriptionPlan: true
      }
    });
    
    console.log(`📊 Negocios encontrados: ${negocios.length}`);
    negocios.forEach(negocio => {
      console.log(`  - ${negocio.name} (${negocio.subdomain}) - ID: ${negocio.id}`);
    });
    
    // 2. Verificar si existe "casa-sabor-demo"
    const casaSaborDemo = negocios.find(n => 
      n.subdomain === 'casa-sabor-demo' || 
      n.name.toLowerCase().includes('casa') && n.name.toLowerCase().includes('sabor')
    );
    
    if (casaSaborDemo) {
      console.log(`\n✅ Negocio encontrado: ${casaSaborDemo.name}`);
      console.log(`   ID: ${casaSaborDemo.id}`);
      console.log(`   Subdomain: ${casaSaborDemo.subdomain}`);
      return casaSaborDemo;
    }
    
    // 3. Crear el negocio si no existe
    console.log('\n❌ Negocio "casa-sabor-demo" no encontrado. Creando...');
    
    const nuevoNegocio = await prisma.business.create({
      data: {
        id: 'cmfnkcc1f0000eyj0dq0lcjji', // Usar el ID que ya tenemos en el config
        name: 'La Casa del Sabor - Demo',
        subdomain: 'casa-sabor-demo',
        subscriptionPlan: 'PREMIUM',
        address: 'Calle Principal 123',
        phone: '+1 234 567 8900',
        email: 'info@casadelsabor.com',
        website: 'https://casa-sabor-demo.lealta.app',
        description: 'Restaurante demo para pruebas del sistema Lealta',
        logoUrl: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af?w=150',
        bannerUrl: 'https://images.unsplash.com/photo-1567306301408-9b74779a11af?w=800',
        isActive: true,
        settings: {
          allowReservations: true,
          maxReservationsPerDay: 50,
          reservationTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
          timezone: 'America/New_York'
        }
      }
    });
    
    console.log(`\n✅ Negocio creado exitosamente:`);
    console.log(`   ID: ${nuevoNegocio.id}`);
    console.log(`   Nombre: ${nuevoNegocio.name}`);
    console.log(`   Subdomain: ${nuevoNegocio.subdomain}`);
    
    return nuevoNegocio;
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 'P2002') {
      console.log('\n💡 El negocio ya existe pero con un ID diferente.');
      console.log('   Verifica si hay un negocio con subdomain similar.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verificarYCrearNegocio();
