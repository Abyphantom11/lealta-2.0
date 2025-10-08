import { PrismaClient } from '@prisma/client';
import { getTarjetasConfigCentral, evaluarNivelCorrespondiente } from '@/lib/tarjetas-config-central';

const prisma = new PrismaClient();

// Función para obtener la configuración del portal
async function getPortalConfig(businessId: string) {
  try {
    // ✅ USAR CONFIGURACIÓN CENTRAL - SINGLE SOURCE OF TRUTH
    const config = await getTarjetasConfigCentral(businessId);
    
    if (!config.jerarquiaValida) {
      console.error(`❌ [EVALUATE] Jerarquía inválida detectada:`, config.erroresValidacion);
    }
    
    return {
      tarjetas: config.tarjetas
    };
  } catch (error) {
    console.error(`❌ [EVALUATE] Error obteniendo configuración central:`, error);
    return null;
  }
}

// Función para evaluar el nivel más alto que le corresponde a un cliente
async function evaluarNivelCliente(cliente: any, businessId: string) {
  // 🎯 CAMBIO CRÍTICO: Usar puntosProgreso de la tarjeta para evaluación automática
  // Esto respeta los reseteos/actualizaciones de asignaciones manuales
  const puntosProgreso = cliente.tarjetaLealtad?.puntosProgreso || cliente.puntosAcumulados || cliente.puntos || 0;
  const visitas = cliente.totalVisitas || 0;

  // ✅ USAR CONFIGURACIÓN CENTRAL - ELIMINANDO HARDCODING
  const nivelCorrespondiente = await evaluarNivelCorrespondiente(businessId, puntosProgreso, visitas);
  
  return nivelCorrespondiente;
}

// Función para crear una nueva tarjeta cuando el cliente no tiene una
async function createNewCard(cliente: any, nivelCorrespondiente: string, businessId: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎴 Creando nueva tarjeta ${nivelCorrespondiente} para cliente ${cliente.id}`);
  }
  
  return await prisma.tarjetaLealtad.create({
    data: {
      clienteId: cliente.id,
      businessId: businessId,
      nivel: nivelCorrespondiente,
      activa: true,
      fechaAsignacion: new Date(),
      puntosProgreso: cliente.puntos || 0,
    },
  });
}

// Función principal que evalúa y actualiza el nivel del cliente
export async function evaluateAndUpdateLevel(clienteId: string, businessId: string) {
  try {
    if (!clienteId || !businessId) {
      console.error('❌ Parámetros inválidos para evaluación de nivel');
      return {
        error: 'Parámetros inválidos',
        actualizado: false,
      };
    }

    // Obtener el cliente completo de la base de datos
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        tarjetaLealtad: true,
      }
    });

    if (!cliente) {
      console.error(`❌ Cliente con ID ${clienteId} no encontrado`);
      return {
        error: 'Cliente no encontrado',
        actualizado: false,
      };
    }

    // Obtener configuración de tarjetas del portal
    const portalConfig = await getPortalConfig(businessId);
    if (!portalConfig || !Array.isArray(portalConfig.tarjetas)) {
      console.error('❌ Configuración de tarjetas no disponible');
      return {
        error: 'Configuración de tarjetas no disponible',
        actualizado: false,
      };
    }

    // Evaluar el nivel que le corresponde al cliente
    const nivelCorrespondiente = await evaluarNivelCliente(cliente, businessId);
    const nivelActual = cliente.tarjetaLealtad?.nivel || 'Bronce';
    const esAsignacionManual = cliente.tarjetaLealtad?.asignacionManual || false;

    // Permitir ascensos automáticos incluso en tarjetas manuales
    // Solo bloquear degradaciones automáticas en tarjetas manuales
    const jerarquia = ['Bronce', 'Plata', 'Oro', 'Diamante', 'Platino'];
    const indexActual = jerarquia.indexOf(nivelActual);
    const indexCorrespondiente = jerarquia.indexOf(nivelCorrespondiente);
    const esAscenso = indexCorrespondiente > indexActual;
    const esDegradacion = indexCorrespondiente < indexActual;

    if (esAsignacionManual && esDegradacion) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚫 Tarjeta asignada manualmente (${nivelActual}), bloqueando solo degradación automática`);
      }
      return {
        message: 'Tarjeta asignada manualmente, no se permite degradación automática',
        nivelActual,
        nivelCorrespondiente,
        actualizado: false,
        esSubida: false,
        razon: 'asignacion_manual_preservada_degradacion',
        info: `La tarjeta ${nivelActual} fue asignada manualmente. Solo se permiten ascensos automáticos.`
      };
    }

    if (esAsignacionManual && esAscenso) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🆙 Tarjeta asignada manualmente (${nivelActual}), pero permitiendo ascenso automático a ${nivelCorrespondiente}`);
      }
    }

    if (nivelActual === nivelCorrespondiente) {
      return {
        message: 'Cliente ya tiene el nivel correcto',
        nivelActual,
        nivelCorrespondiente,
        actualizado: false,
        esSubida: false,
        razon: 'nivel_correcto_mantenido'
      };
    }

    // Crear o actualizar la tarjeta
    if (!cliente.tarjetaLealtad) {
      // Crear nueva tarjeta
      const nuevaTarjeta = await createNewCard(cliente, nivelCorrespondiente, businessId);
      return {
        message: `Tarjeta ${nivelCorrespondiente} asignada al cliente`,
        tarjetaAnterior: null,
        tarjetaNueva: nuevaTarjeta,
        actualizado: true,
        esSubida: true,
        mostrarAnimacion: true,
        razon: 'primera_tarjeta_asignada'
      };
    } else {
      // Actualizar tarjeta existente
      const tarjetaAnterior = cliente.tarjetaLealtad;
      
      // 🎯 MANTENER puntosProgreso correctos - no sobrescribir con puntos canjeables
      const nuevoPuntosProgreso = Math.max(
        tarjetaAnterior.puntosProgreso || 0, // Mantener progreso actual
        cliente.puntos || 0 // O usar puntos si es mayor
      );
      
      const tarjetaActualizada = await prisma.tarjetaLealtad.update({
        where: { id: cliente.tarjetaLealtad.id },
        data: { 
          nivel: nivelCorrespondiente,
          puntosProgreso: nuevoPuntosProgreso,
          asignacionManual: false, // ✅ Marcar como ascenso automático
          fechaAsignacion: new Date() // ✅ Actualizar fecha
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎉 ASCENSO AUTOMÁTICO: ${nivelActual} → ${nivelCorrespondiente} (puntos: ${nuevoPuntosProgreso})`);
      }
      
      return {
        message: `Tarjeta actualizada de ${nivelActual} a ${nivelCorrespondiente}`,
        nivelAnterior: nivelActual,
        nivelNuevo: nivelCorrespondiente,
        tarjetaAnterior,
        tarjetaNueva: tarjetaActualizada,
        actualizado: true,
        esSubida: esAscenso,
        esDegradacion: esDegradacion,
        mostrarAnimacion: esAscenso, // Solo mostrar animación si es ascenso
        razon: esAscenso ? 'ascenso_automatico' : 'ajuste_nivel'
      };
    }
  } catch (error) {
    console.error('❌ Error evaluando nivel de cliente:', error);
    return {
      error: 'Error procesando la evaluación de nivel',
      actualizado: false
    };
  }
}
