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

    // Calcular inicio y fin del mes
    const fechaInicio = new Date(año, mes - 1, 1); // mes - 1 porque Date usa índice 0
    const fechaFin = new Date(año, mes, 0, 23, 59, 59, 999); // día 0 = último día del mes anterior

    console.log(`📊 Generando reporte para businessId=${businessId}, período: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`);

    // Query principal: todas las reservas del período
    const reservations = await prisma.reservation.findMany({
      where: {
        businessId,
        reservedAt: {
          gte: fechaInicio,
          lte: fechaFin,
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
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });

    console.log(`📈 Total reservas encontradas: ${reservations.length}`);

    // ==========================================
    // 1. MÉTRICAS GENERALES
    // ==========================================
    const totalReservas = reservations.length;
    const totalPersonasEsperadas = reservations.reduce((sum, r) => sum + r.guestCount, 0);
    
    // Calcular asistentes reales desde los QR codes escaneados
    const totalAsistentesReales = reservations.reduce((sum, r) => {
      const scanCount = r.qrCodes[0]?.scanCount || 0;
      return sum + scanCount;
    }, 0);
    
    const porcentajeCumplimiento =
      totalPersonasEsperadas > 0
        ? ((totalAsistentesReales / totalPersonasEsperadas) * 100).toFixed(1)
        : '0';
    const promedioPersonasPorReserva =
      totalReservas > 0 ? (totalPersonasEsperadas / totalReservas).toFixed(1) : '0';

    // ==========================================
    // 2. ANÁLISIS POR ASISTENCIA
    // ==========================================
    let completadas = 0; // asistentes == esperadas
    let sobreaforo = 0; // asistentes > esperadas
    let caidas = 0; // asistentes == 0
    let parciales = 0; // 0 < asistentes < esperadas

    reservations.forEach((r) => {
      const scanCount = r.qrCodes[0]?.scanCount || 0;
      if (scanCount === 0) {
        caidas++;
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
    // Estados del enum: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW
    const porEstado = {
      pending: reservations.filter((r) => r.status === 'PENDING').length,
      confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
      checkedIn: reservations.filter((r) => r.status === 'CHECKED_IN').length,
      completed: reservations.filter((r) => r.status === 'COMPLETED').length,
      cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
      noShow: reservations.filter((r) => r.status === 'NO_SHOW').length,
    };

    // ==========================================
    // 5. TOP RANKINGS
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
    // 6. DATOS DETALLADOS PARA TABLA
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
          promedioPersonasPorReserva: parseFloat(promedioPersonasPorReserva),
        },
        porAsistencia: {
          completadas,
          sobreaforo,
          caidas,
          parciales,
        },
        porPago: {
          conComprobante,
          sinComprobante,
          porcentajeConComprobante: parseFloat(porcentajeConComprobante),
        },
        porEstado,
      },
      rankings: {
        top5Dias,
        top5Clientes,
        top5Horarios,
      },
      detalleReservas,
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
