import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import {
  enviarNotificacionClientes,
  TipoNotificacion,
} from '@/lib/notificaciones';

// Type assertion temporal mientras se resuelve la compatibilidad JSON
const extendedPrisma = prisma as any;

// Helper functions para reducir complejidad cognitiva
async function loadPortalConfig(): Promise<Record<string, number>> {
  const puntosRequeridosBase: Record<string, number> = {
    'Bronce': 0,
    'Plata': 500,
    'Oro': 1200,
    'Diamante': 3000,
    'Platino': 5000
  };

  try {
    const configPath = path.join(process.cwd(), 'portal-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const portalConfig = JSON.parse(configData);

    if (portalConfig.tarjetas) {
      portalConfig.tarjetas.forEach((tarjeta: any) => {
        if (tarjeta.condiciones?.puntosMinimos !== undefined) {
          puntosRequeridosBase[tarjeta.nivel as keyof typeof puntosRequeridosBase] = tarjeta.condiciones.puntosMinimos;
        }
      });
    }
  } catch (error) {
    console.warn('⚠️ Error leyendo configuración, usando valores por defecto:', error);
  }

  return puntosRequeridosBase;
}

function analyzeCardChange(currentLevel: string, newLevel: string) {
  const jerarquia = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
  const indexAnterior = jerarquia.indexOf(currentLevel);
  const indexNuevo = jerarquia.indexOf(newLevel);

  return {
    esAscenso: indexNuevo > indexAnterior,
    esDegradacion: indexNuevo < indexAnterior,
    esIgual: indexNuevo === indexAnterior
  };
}

function determineOperationType(isManual: boolean, { esAscenso, esDegradacion }: { esAscenso: boolean, esDegradacion: boolean }) {
  if (!isManual) return 'automatico';
  if (esAscenso) return 'ascenso_manual';
  if (esDegradacion) return 'degradacion_manual';
  return 'mismo_nivel_manual';
}

async function processHistorico(currentHistorico: any): Promise<any> {
  let historicoLimitado: any = {};

  try {
    if (typeof currentHistorico !== 'object' || currentHistorico === null) {
      return {};
    }

    const entradas = Object.keys(currentHistorico);
    if (entradas.length > 10) {
      const entradasOrdenadas = [...entradas].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const entradasRecientes = entradasOrdenadas.slice(0, 10);

      entradasRecientes.forEach(fecha => {
        if (currentHistorico[fecha]) {
          historicoLimitado[fecha] = currentHistorico[fecha];
        }
      });
    } else {
      historicoLimitado = { ...currentHistorico };
    }
  } catch (error) {
    console.warn('⚠️ Error procesando histórico:', error);
    return {};
  }

  return historicoLimitado;
}

async function updateExistingCard(cliente: any, nivel: string, asignacionManual: boolean) {
  const tarjetaExistente = cliente.tarjetaLealtad;
  const changeAnalysis = analyzeCardChange(tarjetaExistente.nivel, nivel);
  const tipoOperacion = determineOperationType(asignacionManual, changeAnalysis);

  let nuevosPuntosProgreso = tarjetaExistente.puntosProgreso;

  if (asignacionManual) {
    const puntosRequeridosBase = await loadPortalConfig();
    nuevosPuntosProgreso = puntosRequeridosBase[nivel] || 0;
  }

  const historicoLimitado = await processHistorico(tarjetaExistente.historicoNiveles);

  const tarjetaActualizada = await extendedPrisma.tarjetaLealtad.update({
    where: { clienteId: cliente.id },
    data: {
      nivel,
      asignacionManual,
      puntosProgreso: nuevosPuntosProgreso,
      fechaAsignacion: new Date(),
      historicoNiveles: {
        ...historicoLimitado,
        [new Date().toISOString()]: {
          nivelAnterior: tarjetaExistente.nivel,
          nivelNuevo: nivel,
          asignacionManual,
          tipoOperacion,
          puntosProgresoAnterior: tarjetaExistente.puntosProgreso,
          puntosProgresoNuevo: nuevosPuntosProgreso
        },
      },
    },
  });

  // Enviar notificación solo para ascensos
  if (changeAnalysis.esAscenso && !(asignacionManual && changeAnalysis.esDegradacion)) {
    await enviarNotificacionClientes(TipoNotificacion.TARJETA_ASIGNADA);
  }

  // 🎯 NUEVO: Para asignaciones manuales, también enviar señal específica al cliente
  if (asignacionManual && changeAnalysis.esAscenso) {
    // Aquí podrías implementar un sistema de notificación específico para el cliente
    // Por ejemplo, usar un sistema de eventos en tiempo real o WebSockets
    console.log(`🔔 Ascenso manual completado: ${cliente.cedula} -> ${nivel}`);
  }

  return {
    tarjetaActualizada,
    changeAnalysis,
    tipoOperacion
  };
}

async function createNewCard(cliente: any, nivel: string, asignacionManual: boolean) {
  const puntosRequeridosBase = await loadPortalConfig();
  const puntosRequeridosNivel = puntosRequeridosBase[nivel] || 0;

  const nuevaTarjeta = await extendedPrisma.tarjetaLealtad.create({
    data: {
      clienteId: cliente.id,
      nivel,
      asignacionManual,
      activa: true,
      puntosProgreso: puntosRequeridosNivel,
      historicoNiveles: {
        [new Date().toISOString()]: {
          nivelAnterior: null,
          nivelNuevo: nivel,
          asignacionManual,
        },
      },
    },
  });

  await enviarNotificacionClientes(TipoNotificacion.TARJETA_ASIGNADA);
  return nuevaTarjeta;
}

export async function POST(request: NextRequest) {
  try {
    const { clienteId, nivel, asignacionManual = false, fastUpdate = false } = await request.json();

    if (!clienteId || !nivel) {
      return NextResponse.json(
        { error: 'Cliente ID y nivel son requeridos' },
        { status: 400 }
      );
    }

    if (fastUpdate) {
      request.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { tarjetaLealtad: true, consumos: true },
    });

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (cliente.tarjetaLealtad) {
      const { tarjetaActualizada, changeAnalysis, tipoOperacion } = await updateExistingCard(
        cliente,
        nivel,
        asignacionManual
      );

      const responseData: any = {
        success: true,
        message: `Tarjeta ${asignacionManual ? 'asignada manualmente' : 'actualizada automáticamente'} exitosamente`,
        tarjeta: tarjetaActualizada,
        operacion: tipoOperacion,
      };

      if (asignacionManual && changeAnalysis.esAscenso) {
        Object.assign(responseData, {
          nivelAnterior: cliente.tarjetaLealtad.nivel,
          nivelNuevo: nivel,
          actualizado: true,
          esSubida: true,
          mostrarAnimacion: true,
          ascensoManual: true
        });
      }

      return NextResponse.json(responseData);
    } else {
      const nuevaTarjeta = await createNewCard(cliente, nivel, asignacionManual);
      return NextResponse.json({
        success: true,
        message: 'Tarjeta creada exitosamente',
        tarjeta: nuevaTarjeta,
      });
    }
  } catch (error) {
    console.error('Error en asignación de tarjeta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
