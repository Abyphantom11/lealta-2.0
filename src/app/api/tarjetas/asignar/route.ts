import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPuntosMinimosConfig } from '@/lib/tarjetas-config-central';
import {
  enviarNotificacionClientes,
  TipoNotificacion,
} from '@/lib/notificaciones';
import { withAuth, AuthConfigs } from '@/middleware/requireAuth';
import { generateId } from '@/lib/generateId';

// Type assertion temporal mientras se resuelve la compatibilidad JSON
const extendedPrisma = prisma as any;

// Helper functions para reducir complejidad cognitiva
async function loadPortalConfig(businessId: string = 'default'): Promise<Record<string, number>> {
  console.log(`🎯 [ASIGNAR] Usando configuración central para ${businessId}`);
  
  try {
    // ✅ USAR CONFIGURACIÓN CENTRAL - ELIMINANDO HARDCODING
    const puntosRequeridosBase = await getPuntosMinimosConfig(businessId);
    
    console.log('✅ [ASIGNAR] Configuración de tarjetas cargada desde central:', puntosRequeridosBase);
    return puntosRequeridosBase;
  } catch (error) {
    console.error('❌ [ASIGNAR] Error obteniendo configuración central:', error);
    
    // Fallback seguro
    return {
      'Bronce': 0,
      'Plata': 100,
      'Oro': 500,
      'Diamante': 1500,
      'Platino': 3000
    };
  }
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

  // 🎯 NUEVA LÓGICA DE RESET PARA ASIGNACIÓN MANUAL
  if (asignacionManual) {
    // ✅ USAR BUSINESS ID DEL CLIENTE
    const businessId = cliente.businessId || 'default';
    const puntosRequeridosBase = await loadPortalConfig(businessId);
    
    // 📌 CUANDO SE ASIGNE MANUALMENTE UNA TARJETA, EL PROGRESO SIEMPRE ES EL MÍNIMO DE ESA TARJETA
    nuevosPuntosProgreso = puntosRequeridosBase[nivel] || 0;
    
    console.log(`🔄 RESET MANUAL: ${cliente.cedula} (business: ${businessId})`);
    console.log(`   Nivel anterior: ${tarjetaExistente.nivel} (progreso: ${tarjetaExistente.puntosProgreso})`);
    console.log(`   Nivel nuevo: ${nivel} (progreso reseteado a: ${nuevosPuntosProgreso})`);
    console.log(`   Tipo operación: ${tipoOperacion}`);
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
          puntosProgresoNuevo: nuevosPuntosProgreso,
          reseteoManual: asignacionManual // 📌 MARCAR CUANDO HUBO RESET
        },
      },
    },
  });

  // ✅ ENVIAR NOTIFICACIÓN SOLO PARA ASCENSOS (NO PARA DEGRADACIONES)
  if (changeAnalysis.esAscenso) {
    await enviarNotificacionClientes(TipoNotificacion.TARJETA_ASIGNADA);
    console.log(`🔔 Notificación de ascenso enviada: ${cliente.cedula} -> ${nivel}`);
  } else if (changeAnalysis.esDegradacion && asignacionManual) {
    console.log(`⬇️ Degradación manual (sin notificación): ${cliente.cedula} -> ${nivel}`);
  }

  return {
    tarjetaActualizada,
    changeAnalysis,
    tipoOperacion
  };
}

async function createNewCard(cliente: any, nivel: string, asignacionManual: boolean) {
  // ✅ USAR BUSINESS ID DEL CLIENTE
  const businessId = cliente.businessId || 'default';
  const puntosRequeridosBase = await loadPortalConfig(businessId);
  
  // 🎯 PARA NUEVAS TARJETAS, EL PROGRESO SIEMPRE ES EL MÍNIMO DEL NIVEL ASIGNADO
  const puntosRequeridosNivel = puntosRequeridosBase[nivel] || 0;

  console.log(`🆕 NUEVA TARJETA: ${cliente.cedula} -> ${nivel} (business: ${businessId}, progreso inicial: ${puntosRequeridosNivel})`);

  const nuevaTarjeta = await extendedPrisma.tarjetaLealtad.create({
    data: {
      id: generateId(),
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
          tipoOperacion: asignacionManual ? 'creacion_manual' : 'creacion_automatica',
          puntosProgresoNuevo: puntosRequeridosNivel
        },
      },
      updatedAt: new Date()
    },
  });

  // ✅ SOLO ENVIAR NOTIFICACIÓN SI ES UN ASCENSO (nueva tarjeta siempre es ascenso desde "sin tarjeta")
  await enviarNotificacionClientes(TipoNotificacion.TARJETA_ASIGNADA);
  console.log(`🔔 Notificación de nueva tarjeta enviada: ${cliente.cedula} -> ${nivel}`);
  
  return nuevaTarjeta;
}

/**
 * 🔒 POST /api/tarjetas/asignar - Asignar o actualizar tarjeta de fidelidad
 * Requiere autenticación: ADMIN o SUPERADMIN
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
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
        include: { TarjetaLealtad: true, Consumo: true },
      });

      if (!cliente) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }

      // 🔐 SECURITY: Validar business ownership
      if (cliente.businessId !== session.businessId && session.role !== 'superadmin') {
        console.log(`❌ AUTH DENIED: User ${session.userId} tried to assign card for client from different business`);
        return NextResponse.json(
          { error: 'No tiene permiso para modificar tarjetas de este cliente' },
          { status: 403 }
        );
      }

      if (cliente.TarjetaLealtad) {
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
            nivelAnterior: cliente.TarjetaLealtad.nivel,
            nivelNuevo: nivel,
            actualizado: true,
            esSubida: true,
            mostrarAnimacion: true,
            ascensoManual: true
          });
        }

        // 📊 LOG DE AUDITORÍA
        console.log(`🎫 Tarjeta asignada por: ${session.role} (${session.userId}) - Cliente: ${clienteId} - Nivel: ${nivel}`);

        return NextResponse.json(responseData);
      } else {
        const nuevaTarjeta = await createNewCard(cliente, nivel, asignacionManual);
        
        // 📊 LOG DE AUDITORÍA
        console.log(`🎫 Nueva tarjeta creada por: ${session.role} (${session.userId}) - Cliente: ${clienteId} - Nivel: ${nivel}`);
        
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
  }, AuthConfigs.WRITE); // Solo ADMIN y SUPERADMIN pueden asignar tarjetas
}
