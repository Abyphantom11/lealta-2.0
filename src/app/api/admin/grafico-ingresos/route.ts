import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// Función helper para generar períodos y reducir complejidad
function generatePeriodos(
  tipo: string,
  mesEspecifico: string | null,
  añoEspecifico: string | null,
  now: Date
): Array<{ label: string; inicio: Date; fin: Date }> {
  const periodos: Array<{ label: string; inicio: Date; fin: Date }> = [];

  if (mesEspecifico) {
    const [año, mes] = mesEspecifico.split('-').map(Number);
    const diasEnMes = new Date(año, mes, 0).getDate();

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes - 1, dia);
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);

      periodos.push({
        label: `${dia}`,
        inicio,
        fin,
      });
    }
    return periodos;
  }

  if (añoEspecifico) {
    const año = parseInt(añoEspecifico);
    for (let mes = 0; mes < 12; mes++) {
      const inicio = new Date(año, mes, 1);
      const fin = new Date(año, mes + 1, 0, 23, 59, 59, 999);

      periodos.push({
        label: inicio.toLocaleDateString('es-ES', { month: 'short' }),
        inicio,
        fin,
      });
    }
    return periodos;
  }

  // Períodos por defecto
  switch (tipo) {
    case 'semana':
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(now);
        fecha.setDate(fecha.getDate() - i);
        const inicio = new Date(fecha);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(fecha);
        fin.setHours(23, 59, 59, 999);

        periodos.push({
          label: fecha.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
          }),
          inicio,
          fin,
        });
      }
      break;

    case 'mes':
      for (let i = 3; i >= 0; i--) {
        const inicioSemana = new Date(now);
        inicioSemana.setDate(inicioSemana.getDate() - i * 7 - 6);
        inicioSemana.setHours(0, 0, 0, 0);

        const finSemana = new Date(now);
        finSemana.setDate(finSemana.getDate() - i * 7);
        finSemana.setHours(23, 59, 59, 999);

        periodos.push({
          label: `Sem ${4 - i}`,
          inicio: inicioSemana,
          fin: finSemana,
        });
      }
      break;

    case 'semestre':
      for (let i = 5; i >= 0; i--) {
        const mes = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const inicio = new Date(mes);
        const fin = new Date(
          mes.getFullYear(),
          mes.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );

        periodos.push({
          label: mes.toLocaleDateString('es-ES', { month: 'short' }),
          inicio,
          fin,
        });
      }
      break;

    case 'año':
      for (let i = 11; i >= 0; i--) {
        const mes = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const inicio = new Date(mes);
        const fin = new Date(
          mes.getFullYear(),
          mes.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );

        periodos.push({
          label: mes.toLocaleDateString('es-ES', {
            month: 'short',
            year: '2-digit',
          }),
          inicio,
          fin,
        });
      }
      break;
  }

  return periodos;
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`📊 Grafico-ingresos GET by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'semana';
    const mesEspecifico = searchParams.get('mes');
    const añoEspecifico = searchParams.get('año');

    console.log('📊 Parámetros recibidos:', {
      tipo,
      mesEspecifico,
      añoEspecifico,
    });

    const now = new Date();

    // Generar períodos basado en filtros
    const periodos = generatePeriodos(tipo, mesEspecifico, añoEspecifico, now);
    const fechaInicio =
      periodos.length > 0
        ? periodos[0].inicio
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fechaFin =
      periodos.length > 0 ? periodos[periodos.length - 1].fin : new Date(now);

    console.log(
      `📊 Período: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`
    );
    console.log(`📊 Periodos generados: ${periodos.length}`);

    // Obtener consumos en el rango SOLO del business del usuario
    const consumos = await prisma.consumo.findMany({
      where: {
        businessId: session.businessId, // ✅ FILTRO POR BUSINESS (actualizado)
        registeredAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      select: {
        total: true,
        registeredAt: true,
      },
      orderBy: {
        registeredAt: 'asc',
      },
    });

    console.log(`📊 Encontrados ${consumos.length} consumos para el gráfico`);

    // Calcular datos por período
    const datosGrafico = periodos.map(periodo => {
      const consumosEnPeriodo = consumos.filter(
        consumo =>
          consumo.registeredAt >= periodo.inicio &&
          consumo.registeredAt <= periodo.fin
      );

      const total = consumosEnPeriodo.reduce(
        (sum, consumo) => sum + consumo.total,
        0
      );

      return {
        label: periodo.label,
        valor: Math.round(total * 100) / 100,
        transacciones: consumosEnPeriodo.length,
      };
    });

    // Calcular estadísticas resumidas
    const totalIngresos = consumos.reduce(
      (sum, consumo) => sum + consumo.total,
      0
    );
    const totalTransacciones = consumos.length;
    const promedio = periodos.length > 0 ? totalIngresos / periodos.length : 0;

    console.log('📊 Estadísticas calculadas:', {
      totalIngresos: Math.round(totalIngresos * 100) / 100,
      totalTransacciones,
      promedio: Math.round(promedio * 100) / 100,
    });

    return NextResponse.json({
      success: true,
      tipo,
      filtros: {
        mes: mesEspecifico,
        año: añoEspecifico,
      },
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin,
      },
      datos: datosGrafico,
      resumen: {
        totalIngresos: Math.round(totalIngresos * 100) / 100,
        totalTransacciones,
        promedioPorPeriodo: Math.round(promedio * 100) / 100,
        maxValor: Math.max(...datosGrafico.map(d => d.valor)),
        minValor: Math.min(...datosGrafico.map(d => d.valor)),
      },
    });
  } catch (error) {
    console.error('❌ Error en API gráfico ingresos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
  }, AuthConfigs.READ_ONLY);
}
