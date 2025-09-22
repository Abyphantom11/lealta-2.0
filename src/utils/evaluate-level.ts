import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Función para obtener la configuración del portal
async function getPortalConfig(businessId: string) {
  try {
    // Primero intentar leer el portal-config específico del business
    const businessSpecificPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    
    if (fs.existsSync(businessSpecificPath)) {
      console.log(`✅ Usando portal-config específico para business ${businessId}`);
      const configData = fs.readFileSync(businessSpecificPath, 'utf8');
      return JSON.parse(configData);
    }
    
    // Si no existe, usar el portal-config general
    const configPath = path.join(process.cwd(), 'portal-config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Error reading portal config:', error);
    return null;
  }
}

// Función para evaluar el nivel más alto que le corresponde a un cliente
function evaluarNivelCliente(cliente: any, tarjetasConfig: any[]) {
  // 🎯 CAMBIO CRÍTICO: Usar puntosProgreso de la tarjeta para evaluación automática
  // Esto respeta los reseteos/actualizaciones de asignaciones manuales
  const puntosProgreso = cliente.tarjetaLealtad?.puntosProgreso || cliente.puntosAcumulados || cliente.puntos || 0;
  const visitas = cliente.totalVisitas || 0;

  console.log(`🤖 Evaluando nivel para cliente ${cliente.id}:`);
  console.log(`   • PuntosProgreso: ${puntosProgreso}`);
  console.log(`   • Puntos canjeables: ${cliente.puntos || 0}`);
  console.log(`   • Visitas: ${visitas}`);
  console.log(`   • Nivel actual: ${cliente.tarjetaLealtad?.nivel || 'Sin tarjeta'}`);
  console.log(`   • Configuración disponible: ${tarjetasConfig.length} niveles`);

  // 🎯 USAR CONFIGURACIÓN HARDCODEADA QUE COINCIDA EXACTAMENTE CON EL ADMIN
  const nivelesHardcoded = [
    { nivel: 'Bronce', puntosMinimos: 0, visitasMinimas: 0 },
    { nivel: 'Plata', puntosMinimos: 100, visitasMinimas: 5 },
    { nivel: 'Oro', puntosMinimos: 500, visitasMinimas: 10 },
    { nivel: 'Diamante', puntosMinimos: 1500, visitasMinimas: 15 },
    { nivel: 'Platino', puntosMinimos: 3000, visitasMinimas: 30 }
  ];

  console.log(`🎯 Usando configuración hardcoded:`);
  nivelesHardcoded.forEach(n => console.log(`   • ${n.nivel}: ${n.puntosMinimos} puntos, ${n.visitasMinimas} visitas`));

  // Obtener el nivel MÁS ALTO que cumple los requisitos (evaluar de mayor a menor)
  const nivelesOrdenados = [...nivelesHardcoded].reverse();
  
  for (const nivelConfig of nivelesOrdenados) {
    const cumplePuntos = puntosProgreso >= nivelConfig.puntosMinimos;
    const cumpleVisitas = visitas >= nivelConfig.visitasMinimas;

    console.log(`🔍 Evaluando ${nivelConfig.nivel}: puntos=${cumplePuntos} (${puntosProgreso}>=${nivelConfig.puntosMinimos}), visitas=${cumpleVisitas} (${visitas}>=${nivelConfig.visitasMinimas})`);

    // Usar lógica OR: cumple puntos O visitas
    if (cumplePuntos || cumpleVisitas) {
      console.log(`✅ Cliente califica para ${nivelConfig.nivel}`);
      return nivelConfig.nivel;
    }
  }

  console.log(`🔧 Fallback a Bronce`);
  return 'Bronce';
}

// Función para crear una nueva tarjeta cuando el cliente no tiene una
async function createNewCard(cliente: any, nivelCorrespondiente: string, businessId: string) {
  console.log(`🎴 Creando nueva tarjeta ${nivelCorrespondiente} para cliente ${cliente.id}`);
  
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
    const nivelCorrespondiente = evaluarNivelCliente(cliente, portalConfig.tarjetas);
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
      console.log(`🚫 Tarjeta asignada manualmente (${nivelActual}), bloqueando solo degradación automática`);
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
      console.log(`🆙 Tarjeta asignada manualmente (${nivelActual}), pero permitiendo ascenso automático a ${nivelCorrespondiente}`);
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
      
      console.log(`🎉 ASCENSO AUTOMÁTICO: ${nivelActual} → ${nivelCorrespondiente} (puntos: ${nuevoPuntosProgreso})`);
      
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
