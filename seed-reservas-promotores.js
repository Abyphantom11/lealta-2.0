/**
 * Script para crear reservas de prueba con diferentes promotores
 * Para validar el análisis por promotor en reportes
 */

const API_URL = 'http://localhost:3001';
const BUSINESS_ID = 'golom';

// Función helper para hacer peticiones
async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`);
  }
  
  return response.json();
}

async function seedReservasConPromotores() {
  console.log('🌱 Iniciando seed de reservas con promotores...\n');

  try {
    // 1. Usar directamente el slug del business
    console.log('📦 Usando business: golom\n');
    const businessId = BUSINESS_ID;

    // 2. Verificar/crear promotores
    console.log('👥 Verificando promotores...');
    let promotores = await request(`${API_URL}/api/promotores?businessId=${businessId}`);
    
    if (!promotores || promotores.length === 0) {
      console.log('⚠️  No hay promotores, creando...');
      
      const promotoresData = [
        { nombre: 'WhatsApp', telefono: '555-0001', email: 'whatsapp@golom.com' },
        { nombre: 'Instagram', telefono: '555-0002', email: 'instagram@golom.com' },
        { nombre: 'Facebook', telefono: '555-0003', email: 'facebook@golom.com' },
        { nombre: 'Recomendación', telefono: '555-0004', email: 'referral@golom.com' },
      ];

      promotores = [];
      for (const data of promotoresData) {
        const promotor = await request(`${API_URL}/api/promotores`, {
          method: 'POST',
          body: JSON.stringify({ ...data, businessId }),
        });
        promotores.push(promotor);
        console.log(`   ✓ ${promotor.nombre}`);
      }
    } else {
      console.log(`✅ ${promotores.length} promotores existentes:`);
      promotores.forEach(p => console.log(`   • ${p.nombre} (${p.id})`));
    }
    console.log('');

    // 3. Obtener servicios y slots
    console.log('🎫 Obteniendo servicios...');
    const services = await request(`${API_URL}/api/reservas/services?businessId=${businessId}`);
    
    if (!services || services.length === 0) {
      throw new Error('No hay servicios disponibles. Crea servicios primero.');
    }
    
    const service = services[0];
    console.log(`✅ Usando servicio: ${service.name}\n`);

    // 4. Obtener slots
    console.log('⏰ Obteniendo slots...');
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    const slots = await request(
      `${API_URL}/api/reservas/slots?businessId=${businessId}&serviceId=${service.id}&date=${dateStr}`
    );
    
    if (!slots || slots.length === 0) {
      throw new Error('No hay slots disponibles para hoy.');
    }
    
    console.log(`✅ ${slots.length} slots disponibles\n`);

    // 5. Crear reservas con diferentes promotores
    console.log('📝 Creando reservas de prueba...');
    console.log('════════════════════════════════════════\n');

    const reservasData = [
      {
        promotor: promotores[0], // WhatsApp
        cliente: 'María González',
        email: 'maria.g@email.com',
        telefono: '555-1001',
        personas: 4,
        source: 'whatsapp',
        asistiran: 4, // Asistencia completa
      },
      {
        promotor: promotores[0], // WhatsApp
        cliente: 'Juan Pérez',
        email: 'juan.p@email.com',
        telefono: '555-1002',
        personas: 6,
        source: 'whatsapp',
        asistiran: 5, // Asistencia parcial
      },
      {
        promotor: promotores[1], // Instagram
        cliente: 'Ana Martínez',
        email: 'ana.m@email.com',
        telefono: '555-1003',
        personas: 2,
        source: 'instagram',
        asistiran: 2, // Asistencia completa
      },
      {
        promotor: promotores[1], // Instagram
        cliente: 'Carlos López',
        email: 'carlos.l@email.com',
        telefono: '555-1004',
        personas: 8,
        source: 'instagram',
        asistiran: 0, // No asistió
      },
      {
        promotor: promotores[2], // Facebook
        cliente: 'Laura Rodríguez',
        email: 'laura.r@email.com',
        telefono: '555-1005',
        personas: 3,
        source: 'facebook',
        asistiran: 3, // Asistencia completa
      },
      {
        promotor: promotores[2], // Facebook
        cliente: 'Pedro Sánchez',
        email: 'pedro.s@email.com',
        telefono: '555-1006',
        personas: 5,
        source: 'facebook',
        asistiran: 6, // Sobreaforo
      },
      {
        promotor: promotores[3], // Recomendación
        cliente: 'Sofia Vargas',
        email: 'sofia.v@email.com',
        telefono: '555-1007',
        personas: 4,
        source: 'referral',
        asistiran: 4, // Asistencia completa
      },
    ];

    const reservasCreadas = [];

    for (let i = 0; i < reservasData.length && i < slots.length; i++) {
      const data = reservasData[i];
      const slot = slots[i];

      try {
        // Crear reserva
        const reserva = await request(`${API_URL}/api/reservas`, {
          method: 'POST',
          body: JSON.stringify({
            businessId: businessId,
            cliente: {
              nombre: data.cliente,
              email: data.email,
              telefono: data.telefono,
            },
            numeroPersonas: data.personas,
            fecha: dateStr,
            hora: slot.startTime,
            serviceId: service.id,
            slotId: slot.id,
            promotor: {
              id: data.promotor.id,
              nombre: data.promotor.nombre,
            },
            razonVisita: 'Cena de prueba',
            beneficiosReserva: 'Cliente frecuente',
            metadata: {
              source: data.source,
              mesa: `Mesa ${i + 1}`,
            },
          }),
        });

        console.log(`✅ Reserva ${i + 1}/${reservasData.length}`);
        console.log(`   Cliente: ${data.cliente}`);
        console.log(`   Promotor: ${data.promotor.nombre}`);
        console.log(`   Personas: ${data.personas}`);
        console.log(`   Asistirán: ${data.asistiran}`);
        
        // Simular asistencia si es necesario
        if (data.asistiran > 0) {
          try {
            await request(`${API_URL}/api/reservas/${reserva.id}/asistencia`, {
              method: 'POST',
              body: JSON.stringify({
                cantidad: data.asistiran,
                metodo: 'manual',
                userId: 'seed-script',
              }),
            });
            console.log(`   ✓ Asistencia registrada: ${data.asistiran} personas\n`);
          } catch (error) {
            console.log(`   ⚠️  Error registrando asistencia: ${error.message}\n`);
          }
        } else {
          console.log(`   ⚠️  Sin asistencia registrada\n`);
        }

        reservasCreadas.push(reserva);

      } catch (error) {
        console.error(`❌ Error creando reserva ${i + 1}:`, error.message);
      }
    }

    // 6. Resumen
    console.log('════════════════════════════════════════');
    console.log('✅ SEED COMPLETADO');
    console.log('════════════════════════════════════════\n');
    console.log(`📊 Estadísticas:`);
    console.log(`   • Reservas creadas: ${reservasCreadas.length}`);
    console.log(`   • Promotores: ${promotores.length}`);
    console.log(`   • Fecha: ${dateStr}\n`);

    console.log('📈 Distribución por promotor:');
    const distribucion = reservasData.reduce((acc, r) => {
      const nombre = r.promotor.nombre;
      acc[nombre] = (acc[nombre] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(distribucion).forEach(([nombre, count]) => {
      console.log(`   • ${nombre}: ${count} reservas`);
    });

    console.log('\n💡 Ahora puedes ejecutar:');
    console.log(`   node test-reporte-promotores.js\n`);

    return true;

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error.message);
    console.error('\n💡 Asegúrate de que:');
    console.error('   1. El servidor esté corriendo (puerto 3001)');
    console.error('   2. El business "golom" existe');
    console.error('   3. Hay servicios y slots configurados\n');
    return false;
  }
}

// Ejecutar el seed
seedReservasConPromotores().then((success) => {
  process.exit(success ? 0 : 1);
});
