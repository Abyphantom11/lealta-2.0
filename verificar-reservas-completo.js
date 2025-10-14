const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarReservasCompleto() {
  try {
    console.log('🔍 VERIFICACIÓN COMPLETA: Base de datos de reservas');
    console.log('='.repeat(70));
    
    // 1. Buscar todos los businesses disponibles
    console.log('🏢 Buscando todos los businesses...');
    const allBusinesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true
      }
    });
    
    console.log(`📊 Total de businesses encontrados: ${allBusinesses.length}`);
    allBusinesses.forEach((b, idx) => {
      console.log(`   ${idx + 1}. ${b.name} (ID: ${b.id})`);
      console.log(`      Slug: ${b.slug || 'N/A'}`);
      console.log(`      Subdomain: ${b.subdomain || 'N/A'}`);
    });
    
    // 2. Buscar el business "Casa del Sabor"
    const casaDelSabor = allBusinesses.find(b => 
      b.name.toLowerCase().includes('casa del sabor') ||
      b.slug?.includes('casa-del-sabor') ||
      b.subdomain?.includes('casadelsabor')
    );
    
    if (!casaDelSabor) {
      console.log('❌ No se encontró el business "Casa del Sabor"');
      return;
    }
    
    console.log(`\n✅ Business "Casa del Sabor" encontrado:`);
    console.log(`   ID: ${casaDelSabor.id}`);
    console.log(`   Nombre: ${casaDelSabor.name}`);
    console.log(`   Slug: ${casaDelSabor.slug}`);
    
    // 3. Verificar TODAS las tablas relacionadas con reservas
    console.log('\n📋 VERIFICANDO TABLAS DE RESERVAS:');
    console.log('='.repeat(50));
    
    // Tabla: reservation (nueva tabla Prisma)
    try {
      const reservationCount = await prisma.reservation.count({
        where: { businessId: casaDelSabor.id }
      });
      console.log(`📊 Tabla "reservation": ${reservationCount} registros`);
      
      if (reservationCount > 0) {
        const sampleReservations = await prisma.reservation.findMany({
          where: { businessId: casaDelSabor.id },
          take: 3,
          include: {
            cliente: true,
            service: true,
            slot: true
          },
          orderBy: { createdAt: 'desc' }
        });
        
        console.log(`   📝 Muestra de registros:`);
        sampleReservations.forEach((r, idx) => {
          const fecha = r.slot?.date ? new Date(r.slot.date).toISOString().split('T')[0] : 'Sin fecha';
          console.log(`      ${idx + 1}. ${r.customerName} - ${fecha} (${r.status})`);
        });
      }
    } catch (error) {
      console.log(`❌ Error en tabla "reservation": ${error.message}`);
    }
    
    // Tabla: reserva (tabla anterior/legacy)
    try {
      const reservaCount = await prisma.reserva.count({
        where: { businessId: casaDelSabor.id }
      });
      console.log(`📊 Tabla "reserva": ${reservaCount} registros`);
      
      if (reservaCount > 0) {
        const sampleReservas = await prisma.reserva.findMany({
          where: { businessId: casaDelSabor.id },
          take: 3,
          orderBy: { createdAt: 'desc' }
        });
        
        console.log(`   📝 Muestra de registros:`);
        sampleReservas.forEach((r, idx) => {
          console.log(`      ${idx + 1}. ${r.clientName || 'Sin nombre'} - ${r.date || 'Sin fecha'} (${r.status})`);
        });
      }
    } catch (error) {
      console.log(`❌ Error en tabla "reserva": ${error.message}`);
    }
    
    // Tabla: Reserva (con R mayúscula, por si acaso)
    try {
      const ReservaCount = await prisma.Reserva.count({
        where: { businessId: casaDelSabor.id }
      });
      console.log(`📊 Tabla "Reserva": ${ReservaCount} registros`);
    } catch (error) {
      console.log(`❌ Error en tabla "Reserva": ${error.message}`);
    }
    
    // 4. Verificar tablas relacionadas
    console.log('\n🔗 VERIFICANDO TABLAS RELACIONADAS:');
    
    // Clientes
    try {
      const clientesCount = await prisma.cliente.count({
        where: { businessId: casaDelSabor.id }
      });
      console.log(`👥 Clientes: ${clientesCount} registros`);
    } catch (error) {
      console.log(`❌ Error en clientes: ${error.message}`);
    }
    
    // Services
    try {
      const servicesCount = await prisma.reservationService.count({
        where: { businessId: casaDelSabor.id }
      });
      console.log(`🛎️ Services: ${servicesCount} registros`);
    } catch (error) {
      console.log(`❌ Error en services: ${error.message}`);
    }
    
    // Slots
    try {
      const slotsCount = await prisma.reservationSlot.count({
        where: { businessId: casaDelSabor.id }
      });
      console.log(`⏰ Slots: ${slotsCount} registros`);
    } catch (error) {
      console.log(`❌ Error en slots: ${error.message}`);
    }
    
    // QR Codes
    try {
      const qrCount = await prisma.reservationQRCode.count({
        where: { businessId: casaDelSabor.id }
      });
      console.log(`📱 QR Codes: ${qrCount} registros`);
    } catch (error) {
      console.log(`❌ Error en QR codes: ${error.message}`);
    }
    
    // 5. Buscar reservas en TODOS los businesses (por si están en otro)
    console.log('\n🌍 BÚSQUEDA GLOBAL EN TODOS LOS BUSINESSES:');
    console.log('='.repeat(50));
    
    for (const business of allBusinesses) {
      try {
        const reservationCount = await prisma.reservation.count({
          where: { businessId: business.id }
        });
        
        if (reservationCount > 0) {
          console.log(`📊 ${business.name}: ${reservationCount} reservas`);
          
          // Si encontramos el que tiene 133, mostrar detalles
          if (reservationCount === 133 || reservationCount > 100) {
            console.log(`   🎯 ¡POSIBLE MATCH! Business con muchas reservas:`);
            console.log(`      ID: ${business.id}`);
            console.log(`      Nombre: ${business.name}`);
            console.log(`      Slug: ${business.slug}`);
            
            // Mostrar algunas reservas recientes
            const recentReservations = await prisma.reservation.findMany({
              where: { businessId: business.id },
              take: 5,
              include: { slot: true },
              orderBy: { createdAt: 'desc' }
            });
            
            console.log(`   📋 Últimas 5 reservas:`);
            recentReservations.forEach((r, idx) => {
              const fecha = r.slot?.date ? new Date(r.slot.date).toISOString().split('T')[0] : 'Sin fecha';
              console.log(`      ${idx + 1}. ${r.customerName} - ${fecha} (${r.status})`);
            });
            
            // Buscar reservas de hoy
            const hoy = new Date('2025-10-13');
            const reservasHoy = await prisma.reservation.count({
              where: {
                businessId: business.id,
                slot: {
                  date: {
                    gte: hoy,
                    lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
                  }
                }
              }
            });
            console.log(`   📅 Reservas para hoy (13/10/2025): ${reservasHoy}`);
          }
        }
      } catch (error) {
        console.log(`❌ Error verificando ${business.name}: ${error.message}`);
      }
    }
    
    // 6. Verificar esquema de la base de datos
    console.log('\n🗄️ INFORMACIÓN DEL ESQUEMA:');
    try {
      const tablesInfo = await prisma.$queryRaw`
        SELECT table_name, table_rows 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name LIKE '%reserv%'
      `;
      console.log('📊 Tablas relacionadas con reservas:', tablesInfo);
    } catch (error) {
      console.log(`❌ Error obteniendo info del esquema: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error general en verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarReservasCompleto();
