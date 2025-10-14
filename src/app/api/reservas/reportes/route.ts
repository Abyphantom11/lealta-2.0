import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reservas/reportes
 * Genera estadísticas mensuales para reportes en PDF
 * Query params: businessId, mes (1-12), año (2024, 2025...)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const mesParam = searchParams.get('mes');
    const añoParam = searchParams.get('año');

    // Validaciones
    if (!businessId) {
      return NextResponse.json({ error: 'businessId es requerido' }, { status: 400 });
    }

    if (!mesParam || !añoParam) {
      return NextResponse.json(
        { error: 'mes y año son requeridos. Ejemplo: mes=1&año=2025' },
        { status: 400 }
      );
    }

    const mes = parseInt(mesParam, 10);
    const año = parseInt(añoParam, 10);

    if (mes < 1 || mes > 12) {
      return NextResponse.json({ error: 'mes debe estar entre 1 y 12' }, { status: 400 });
    }

    if (año < 2020 || año > 2100) {
      return NextResponse.json({ error: 'año inválido' }, { status: 400 });
    }

    // Calcular inicio y fin del mes (en UTC para evitar problemas de zona horaria)
    // Mes 9 (septiembre) = índice 8 en JavaScript (0-based)
    const fechaInicio = new Date(Date.UTC(año, mes - 1, 1, 0, 0, 0, 0));
    const fechaFin = new Date(Date.UTC(año, mes, 1, 0, 0, 0, 0)); // Primer día del siguiente mes

    console.log(`📊 Generando reporte para businessId=${businessId}`);
    console.log(`   Mes: ${mes}/${año}`);
    console.log(`   Período: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`);

    // Query principal: todas las reservas del período
    const reservations = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: fechaInicio,
          lt: fechaFin, // lt (less than) en lugar de lte para excluir el primer día del siguiente mes
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            correo: true,
          },
        },
        qrCodes: {
          select: {
            scanCount: true,
            lastScannedAt: true,
          },
        },
        promotor: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            email: true,
          },
        },
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });

    console.log(`📈 Total reservas encontradas: ${reservations.length}`);

    // ==========================================
    // NUEVA SECCIÓN: DATOS SIN RESERVA
    // ==========================================
    const sinReservas = await prisma.sinReserva.findMany({
      where: {
        businessId,
        fecha: {
          gte: fechaInicio,
          lt: fechaFin,
        },
      },
      orderBy: {
        fecha: 'asc',
      },
    });

    console.log(`👥 Total registros sin reserva encontrados: ${sinReservas.length}`);

    // Calcular estadísticas de sin reserva
    const totalRegistrosSinReserva = sinReservas.length;
    const totalPersonasSinReserva = sinReservas.reduce((sum, r) => sum + r.numeroPersonas, 0);
    
    // Agrupar por día para análisis
    const sinReservaPorDia = sinReservas.reduce((acc, r) => {
      const fecha = r.fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      if (!acc[fecha]) {
        acc[fecha] = { registros: 0, personas: 0 };
      }
      acc[fecha].registros++;
      acc[fecha].personas += r.numeroPersonas;
      return acc;
    }, {} as Record<string, { registros: number; personas: number }>);

    // Calcular promedio diario de personas sin reserva
    const diasConSinReserva = Object.keys(sinReservaPorDia).length;
    const promedioPersonasSinReservaPorDia = diasConSinReserva > 0 
      ? Math.round((totalPersonasSinReserva / diasConSinReserva) * 100) / 100 
      : 0;

    // Top 5 días con más personas sin reserva
    const top5DiasSinReserva = Object.entries(sinReservaPorDia)
      .sort((a, b) => b[1].personas - a[1].personas)
      .slice(0, 5)
      .map(([fecha, data]) => ({ fecha, personas: data.personas, registros: data.registros }));

    // ==========================================
    // 1. MÉTRICAS GENERALES (ACTUALIZADAS)
    // ==========================================
    const totalReservas = reservations.length;
    const totalPersonasEsperadas = reservations.reduce((sum, r) => sum + r.guestCount, 0);
    
    // Calcular asistentes reales desde los QR codes escaneados
    const totalAsistentesReales = reservations.reduce((sum, r) => {
      const scanCount = r.qrCodes[0]?.scanCount || 0;
      return sum + scanCount;
    }, 0);

    // ✅ NUEVAS MÉTRICAS: Totales combinados (Reservas + Sin Reserva)
    const totalPersonasAtendidas = totalAsistentesReales + totalPersonasSinReserva;
    const totalEventosAtendidos = totalReservas + totalRegistrosSinReserva;
    
    const porcentajeCumplimiento =
      totalPersonasEsperadas > 0
        ? ((totalAsistentesReales / totalPersonasEsperadas) * 100).toFixed(1)
        : '0';

    // ==========================================
    // 2. ANÁLISIS POR ASISTENCIA
    // ==========================================
    let completadas = 0; // asistentes == esperadas
    let sobreaforo = 0; // asistentes > esperadas
    let caidas = 0; // NO_SHOW o no asistieron (sin cancelar)
    let parciales = 0; // 0 < asistentes < esperadas
    let canceladas = 0; // ✅ NUEVO: Cliente canceló con aviso

    reservations.forEach((r) => {
      const scanCount = r.qrCodes[0]?.scanCount || 0;
      
      // Primero verificar si fue cancelada explícitamente
      if (r.status === 'CANCELLED') {
        canceladas++;
        return; // No contar en otras categorías
      }
      
      // Luego analizar asistencia
      if (scanCount === 0) {
        caidas++; // Caída real: no vino sin avisar
      } else if (scanCount === r.guestCount) {
        completadas++;
      } else if (scanCount > r.guestCount) {
        sobreaforo++;
      } else {
        parciales++;
      }
    });

    // ==========================================
    // 3. ANÁLISIS DE PAGOS
    // ==========================================
    // El schema usa isPaid y paymentReference en lugar de hasPaymentProof
    const conComprobante = reservations.filter((r) => r.isPaid || r.paymentReference).length;
    const sinComprobante = totalReservas - conComprobante;
    const porcentajeConComprobante =
      totalReservas > 0 ? ((conComprobante / totalReservas) * 100).toFixed(1) : '0';

    // ==========================================
    // 4. ANÁLISIS POR ESTADO
    // ==========================================
    // Estados del enum: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED
    const porEstado = {
      pending: reservations.filter((r) => r.status === 'PENDING').length,
      confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
      checkedIn: reservations.filter((r) => r.status === 'CHECKED_IN').length,
      completed: reservations.filter((r) => r.status === 'COMPLETED').length,
      cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
    };

    // ==========================================
    // 5. ANÁLISIS POR PROMOTOR
    // ==========================================
    const reservasPorPromotor = reservations.reduce((acc, r) => {
      const promotorId = r.promotorId || 'sin-promotor';
      const promotorNombre = r.promotor?.nombre || 'Sin asignar';
      const scanCount = r.qrCodes[0]?.scanCount || 0;
      
      if (!acc[promotorId]) {
        acc[promotorId] = {
          id: promotorId,
          nombre: promotorNombre,
          totalReservas: 0,
          personasEsperadas: 0,
          personasAsistieron: 0,
          reservasCompletadas: 0, // asistieron == esperadas
          reservasParciales: 0, // 0 < asistieron < esperadas
          reservasCaidas: 0, // no asistieron (sin cancelar)
          reservasSobreaforo: 0, // asistieron > esperadas
          reservasCanceladas: 0, // ✅ NUEVO: cliente canceló
          porcentajeCumplimiento: 0,
        };
      }
      
      acc[promotorId].totalReservas++;
      
      // Verificar si fue cancelada
      if (r.status === 'CANCELLED') {
        acc[promotorId].reservasCanceladas++;
        // No contar esperadas/asistieron en canceladas
        return acc;
      }
      
      // Solo contar esperadas/asistieron si no fue cancelada
      acc[promotorId].personasEsperadas += r.guestCount;
      acc[promotorId].personasAsistieron += scanCount;
      
      // Clasificar según asistencia
      if (scanCount === 0) {
        acc[promotorId].reservasCaidas++;
      } else if (scanCount === r.guestCount) {
        acc[promotorId].reservasCompletadas++;
      } else if (scanCount > r.guestCount) {
        acc[promotorId].reservasSobreaforo++;
      } else {
        acc[promotorId].reservasParciales++;
      }
      
      return acc;
    }, {} as Record<string, {
      id: string;
      nombre: string;
      totalReservas: number;
      personasEsperadas: number;
      personasAsistieron: number;
      reservasCompletadas: number;
      reservasParciales: number;
      reservasCaidas: number;
      reservasSobreaforo: number;
      reservasCanceladas: number;
      porcentajeCumplimiento: number;
    }>);

    // Calcular porcentaje de cumplimiento para cada promotor
    Object.values(reservasPorPromotor).forEach((stats) => {
      stats.porcentajeCumplimiento =
        stats.personasEsperadas > 0
          ? parseFloat(((stats.personasAsistieron / stats.personasEsperadas) * 100).toFixed(1))
          : 0;
    });

    const statsPromotores = Object.values(reservasPorPromotor);

    // Top 5 promotores por cantidad de reservas
    const top5Promotores = [...statsPromotores]
      .sort((a, b) => b.totalReservas - a.totalReservas)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        cantidad: p.totalReservas,
        cumplimiento: p.porcentajeCumplimiento
      }));

    // ==========================================
    // 6. TOP RANKINGS
    // ==========================================

    // Top 5 días con más reservas
    const reservasPorDia = reservations.reduce((acc, r) => {
      const fecha = new Date(r.reservedAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      acc[fecha] = (acc[fecha] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const top5Dias = Object.entries(reservasPorDia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }));

    // Top 5 clientes con más reservas
    const reservasPorCliente = reservations.reduce((acc, r) => {
      if (r.cliente) {
        const key = r.cliente.id;
        if (!acc[key]) {
          acc[key] = {
            id: r.cliente.id,
            nombre: r.cliente.nombre,
            cantidad: 0,
          };
        }
        acc[key].cantidad++;
      }
      return acc;
    }, {} as Record<string, { id: string; nombre: string; cantidad: number }>);

    const top5Clientes = Object.values(reservasPorCliente)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    // Top 5 horarios más populares
    const reservasPorHorario = reservations.reduce((acc, r) => {
      const horario = new Date(r.reservedAt).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
      acc[horario] = (acc[horario] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const top5Horarios = Object.entries(reservasPorHorario)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([horario, cantidad]) => ({ horario, cantidad }));

    // ==========================================
    // 8. DATOS DETALLADOS PARA TABLA
    // ==========================================
    const detalleReservas = reservations.map((r) => {
      const metadata = (r.metadata as any) || {};
      const scanCount = r.qrCodes[0]?.scanCount || 0;
      
      return {
        id: r.id,
        fecha: new Date(r.reservedAt).toLocaleDateString('es-ES'),
        hora: new Date(r.reservedAt).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        cliente: r.cliente?.nombre || r.customerName || 'Sin nombre',
        email: r.cliente?.correo || r.customerEmail || '',
        mesa: metadata.mesa || '',
        esperadas: r.guestCount,
        asistentes: scanCount,
        estado: r.status,
        comprobante: (r.isPaid || r.paymentReference) ? 'Sí' : 'No',
        promotor: r.promotor?.nombre || 'Sin asignar',
        promotorId: r.promotorId || null,
      };
    });

    // ==========================================
    // RESPUESTA FINAL
    // ==========================================
    const reporte = {
      periodo: {
        mes,
        año,
        mesNombre: new Date(año, mes - 1, 1).toLocaleDateString('es-ES', { month: 'long' }),
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      },
      metricas: {
        generales: {
          totalReservas,
          totalPersonasEsperadas,
          totalAsistentesReales,
          porcentajeCumplimiento: parseFloat(porcentajeCumplimiento),
          // ✅ NUEVAS MÉTRICAS SIN RESERVA
          totalRegistrosSinReserva,
          totalPersonasSinReserva,
          promedioPersonasSinReservaPorDia,
          diasConSinReserva,
          // ✅ MÉTRICAS COMBINADAS
          totalPersonasAtendidas, // Asistentes reales + Sin reserva
          totalEventosAtendidos, // Total reservas + Total registros sin reserva
        },
        porAsistencia: {
          completadas,
          sobreaforo,
          caidas,
          parciales,
          canceladas, // ✅ NUEVO: Reservas canceladas por el cliente
        },
        porPago: {
          conComprobante,
          sinComprobante,
          porcentajeConComprobante: parseFloat(porcentajeConComprobante),
        },
        porEstado,
        porPromotor: statsPromotores, // ✅ Estadísticas detalladas por promotor
        // ✅ NUEVA SECCIÓN: SIN RESERVA
        sinReserva: {
          totalRegistros: totalRegistrosSinReserva,
          totalPersonas: totalPersonasSinReserva,
          promedioDiario: promedioPersonasSinReservaPorDia,
          diasConRegistros: diasConSinReserva,
          registrosPorDia: sinReservaPorDia,
        },
      },
      rankings: {
        top5Dias,
        top5Clientes,
        top5Horarios,
        top5Promotores, // ✅ Top 5 promotores por cantidad de reservas
        // ✅ NUEVOS RANKINGS SIN RESERVA
        top5DiasSinReserva,
      },
      detalleReservas,
      // ✅ NUEVA SECCIÓN: DETALLE SIN RESERVA
      detalleSinReservas: sinReservas.map(sr => ({
        id: sr.id,
        fecha: sr.fecha.toLocaleDateString('es-ES'),
        hora: sr.hora,
        personas: sr.numeroPersonas,
        notas: sr.notas || '',
        registradoPor: sr.registradoPor || 'Sistema',
      })),
    };

    console.log(`✅ Reporte generado exitosamente con ${totalReservas} reservas`);

    return NextResponse.json(reporte);
  } catch (error) {
    console.error('❌ Error generando reporte:', error);
    return NextResponse.json(
      {
        error: 'Error generando reporte',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
