const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticarQRExpirations() {
  console.log('🔍 DIAGNÓSTICO DE EXPIRACIÓN DE QR CODES DE RESERVAS');
  console.log('='.repeat(70));
  
  try {
    // 1. Obtener QR codes de reservas recientes
    const qrCodes = await prisma.reservationQRCode.findMany({
      include: {
        Reservation: {
          include: {
            ReservationSlot: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`📊 QR codes de reservas encontrados: ${qrCodes.length}\n`);

    const ahora = new Date();
    console.log(`🕐 Hora actual del servidor: ${ahora.toISOString()}`);
    console.log(`🌍 Hora actual en Colombia: ${ahora.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}\n`);

    for (const qr of qrCodes) {
      const reserva = qr.Reservation;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📱 QR: ${qr.qrToken}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log(`👤 Cliente: ${reserva.customerName}`);
      console.log(`📅 Reserva para: ${reserva.reservedAt.toISOString()}`);
      console.log(`📅 Reserva (Colombia): ${reserva.reservedAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      
      console.log(`⏰ QR expira: ${qr.expiresAt.toISOString()}`);
      console.log(`⏰ QR expira (Colombia): ${qr.expiresAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      
      // Calcular diferencias
      const tiempoReserva = reserva.reservedAt.getTime();
      const tiempoExpiracion = qr.expiresAt.getTime();
      const diferenciaHoras = (tiempoExpiracion - tiempoReserva) / (1000 * 60 * 60);
      
      console.log(`⏱️ Diferencia: ${diferenciaHoras.toFixed(1)} horas entre reserva y expiración`);
      
      // Verificar si está expirado
      const msParaExpirar = qr.expiresAt.getTime() - ahora.getTime();
      const horasParaExpirar = msParaExpirar / (1000 * 60 * 60);
      
      if (msParaExpirar > 0) {
        console.log(`✅ Estado: VÁLIDO (expira en ${horasParaExpirar.toFixed(1)} horas)`);
      } else {
        console.log(`❌ Estado: EXPIRADO (hace ${Math.abs(horasParaExpirar).toFixed(1)} horas)`);
        console.log('🚨 PROBLEMA DETECTADO');
      }
      
      console.log('');
    }

    // 2. Analizar patrón de expiración incorrecta
    const ahoraUTC = new Date();
    const qrsExpirados = qrCodes.filter(qr => qr.expiresAt.getTime() < ahoraUTC.getTime());
    
    if (qrsExpirados.length > 0) {
      console.log('🚨 QR CODES EXPIRADOS ENCONTRADOS:');
      console.log('═'.repeat(50));
      
      for (const qr of qrsExpirados) {
        const horasExpirado = (ahoraUTC.getTime() - qr.expiresAt.getTime()) / (1000 * 60 * 60);
        console.log(`❌ ${qr.qrToken} - Expirado hace ${horasExpirado.toFixed(1)} horas`);
        
        // Simular fecha de expiración correcta (en timezone de Colombia)
        const fechaReservaCorrecta = new Date(qr.Reservation.reservedAt);
        
        // Si la reserva fue creada con timezone incorrecto, ajustar
        const fechaExpiracionCorrecta = new Date(fechaReservaCorrecta.getTime() + (12 * 60 * 60 * 1000));
        
        console.log(`   💡 Debería expirar: ${fechaExpiracionCorrecta.toISOString()}`);
        console.log(`   💡 En Colombia: ${fechaExpiracionCorrecta.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        
        // Verificar si sería válido con el timezone correcto
        if (fechaExpiracionCorrecta.getTime() > ahoraUTC.getTime()) {
          console.log(`   ✅ Con timezone correcto, SERÍA VÁLIDO`);
        } else {
          console.log(`   ❌ Incluso con timezone correcto, estaría expirado`);
        }
        console.log('');
      }
    }

    // 3. Proponer solución
    console.log('💡 SOLUCIONES PROPUESTAS:');
    console.log('═'.repeat(50));
    console.log('1. 🔧 Actualizar la lógica de creación de fechas para usar timezone de Colombia');
    console.log('2. 📅 Extender fechas de expiración de QR codes existentes');
    console.log('3. 🌍 Configurar el servidor para usar America/Bogota como timezone default');
    console.log('4. ⚙️ Usar libraries como date-fns-tz para manejar timezones correctamente');
    
    // 4. Generar script de corrección
    if (qrsExpirados.length > 0) {
      console.log('\n🔧 SCRIPT DE CORRECCIÓN:');
      console.log('═'.repeat(30));
      console.log('Para corregir los QR codes expirados, ejecutar:');
      console.log('');
      
      for (const qr of qrsExpirados) {
        const nuevaExpiracion = new Date();
        nuevaExpiracion.setDate(nuevaExpiracion.getDate() + 1); // Extender 24 horas
        
        console.log(`// Corregir QR ${qr.qrToken}`);
        console.log(`await prisma.reservationQRCode.update({`);
        console.log(`  where: { id: '${qr.id}' },`);
        console.log(`  data: { expiresAt: new Date('${nuevaExpiracion.toISOString()}') }`);
        console.log(`});`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticarQRExpirations();
