const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * 🔧 SCRIPT PARA CORREGIR EL PROBLEMA DE TIMEZONE EN QR CODES
 * 
 * El problema: Las fechas de reserva se crean usando new Date() que interpreta
 * la fecha en UTC, pero el negocio opera en America/Bogota (UTC-5).
 * 
 * Esto causa que los QR codes expiren 5 horas antes de lo esperado.
 */

async function corregirTimezoneQRCodes() {
  console.log('🔧 CORRECCIÓN DE TIMEZONE EN QR CODES DE RESERVAS');
  console.log('='.repeat(70));
  
  try {
    // 1. Buscar QR codes que podrían estar afectados
    const ahora = new Date();
    const hace24Horas = new Date(ahora.getTime() - (24 * 60 * 60 * 1000));
    
    const qrCodesRecientes = await prisma.reservationQRCode.findMany({
      where: {
        createdAt: {
          gte: hace24Horas // Últimas 24 horas
        }
      },
      include: {
        Reservation: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 QR codes de las últimas 24 horas: ${qrCodesRecientes.length}\n`);

    let qrsCorregidos = 0;
    let qrsNoNecesitanCorreccion = 0;

    for (const qr of qrCodesRecientes) {
      const reserva = qr.Reservation;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📱 Analizando QR: ${qr.qrToken}`);
      console.log(`👤 Cliente: ${reserva.customerName}`);
      
      // Analizar la fecha actual de la reserva
      const fechaReservaActual = reserva.reservedAt;
      const fechaExpiracionActual = qr.expiresAt;
      
      console.log(`📅 Fecha reserva actual: ${fechaReservaActual.toISOString()}`);
      console.log(`📅 En Colombia: ${fechaReservaActual.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      console.log(`⏰ Expira actual: ${fechaExpiracionActual.toISOString()}`);
      console.log(`⏰ En Colombia: ${fechaExpiracionActual.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
      
      // Verificar si el QR está "incorrectamente expirado"
      const horasParaExpirar = (fechaExpiracionActual.getTime() - ahora.getTime()) / (1000 * 60 * 60);
      
      if (horasParaExpirar < 0 && horasParaExpirar > -6) {
        // QR expirado pero dentro del rango de 6 horas - posible problema de timezone
        console.log(`🚨 POSIBLE PROBLEMA: Expirado hace ${Math.abs(horasParaExpirar).toFixed(1)} horas (dentro del rango de timezone)`);
        
        // Calcular nueva fecha de expiración agregando 5 horas (diferencia Colombia-UTC)
        const nuevaFechaExpiracion = new Date(fechaExpiracionActual.getTime() + (5 * 60 * 60 * 1000));
        
        console.log(`💡 Nueva expiración propuesta: ${nuevaFechaExpiracion.toISOString()}`);
        console.log(`💡 En Colombia: ${nuevaFechaExpiracion.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
        
        const horasConCorreccion = (nuevaFechaExpiracion.getTime() - ahora.getTime()) / (1000 * 60 * 60);
        
        if (horasConCorreccion > 0) {
          console.log(`✅ Con corrección sería válido por ${horasConCorreccion.toFixed(1)} horas más`);
          
          // APLICAR LA CORRECCIÓN
          await prisma.reservationQRCode.update({
            where: { id: qr.id },
            data: { 
              expiresAt: nuevaFechaExpiracion,
              updatedAt: new Date()
            }
          });
          
          console.log('🔧 ✅ QR CORREGIDO');
          qrsCorregidos++;
        } else {
          console.log(`❌ Incluso con corrección, estaría expirado`);
        }
      } else if (horasParaExpirar > 0) {
        console.log(`✅ QR válido (expira en ${horasParaExpirar.toFixed(1)} horas)`);
        qrsNoNecesitanCorreccion++;
      } else {
        console.log(`❌ QR expirado hace ${Math.abs(horasParaExpirar).toFixed(1)} horas (expiración natural)`);
      }
      
      console.log('');
    }

    console.log('📊 RESUMEN DE CORRECCIONES:');
    console.log('═'.repeat(40));
    console.log(`✅ QR codes corregidos: ${qrsCorregidos}`);
    console.log(`👍 QR codes que no necesitaban corrección: ${qrsNoNecesitanCorreccion}`);
    console.log(`📊 Total procesados: ${qrCodesRecientes.length}`);

    // 2. Ahora vamos a corregir el código fuente para evitar futuros problemas
    console.log('\n💡 PRÓXIMOS PASOS PARA FIX PERMANENTE:');
    console.log('═'.repeat(50));
    console.log('1. 🔧 Modificar src/app/api/reservas/route.ts');
    console.log('2. 🌍 Usar timezone-aware date creation');
    console.log('3. 📝 Agregar logs de debugging de timezone');
    console.log('4. 🧪 Probar con reservas nuevas');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corregirTimezoneQRCodes();
