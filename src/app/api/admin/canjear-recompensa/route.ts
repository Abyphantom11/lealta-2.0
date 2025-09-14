import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { clienteId, recompensaId, recompensaNombre: nombreRecompensa, puntosDescontados } = await request.json();

    // Validar datos requeridos
    if (!clienteId || !recompensaId || !puntosDescontados) {
      return NextResponse.json(
        { success: false, message: 'Datos requeridos faltantes' },
        { status: 400 }
      );
    }

    // Obtener cliente actual
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, message: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el cliente tiene suficientes puntos
    if (cliente.puntos < puntosDescontados) {
      return NextResponse.json(
        { 
          success: false, 
          message: `El cliente no tiene suficientes puntos. Disponibles: ${cliente.puntos}, Requeridos: ${puntosDescontados}` 
        },
        { status: 400 }
      );
    }

    // Usar el nombre de recompensa que viene del frontend, o como fallback buscar en la configuración
    let recompensaNombre = nombreRecompensa || 'Recompensa';
    
    // Si no viene el nombre del frontend, intentar obtenerlo de la configuración
    if (!nombreRecompensa) {
      const portalConfig = await prisma.portalConfig.findFirst({
        where: { businessId: cliente.businessId || undefined },
      });

      if (portalConfig?.recompensas) {
        const recompensas = Array.isArray(portalConfig.recompensas) 
          ? portalConfig.recompensas 
          : [];
        const recompensa = recompensas.find((r: any) => r.id === recompensaId);
        if (recompensa) {
          recompensaNombre = (recompensa as any).titulo || (recompensa as any).nombre || 'Recompensa';
        }
      }
    }

    // Iniciar transacción para actualizar puntos y guardar historial
    const resultado = await prisma.$transaction(async (tx) => {
      // ✅ CORRECCIÓN: Solo descontar puntos DISPONIBLES, NO puntosAcumulados
      // Los puntosAcumulados determinan el nivel y NUNCA deben disminuir
      const clienteActualizado = await tx.cliente.update({
        where: { id: clienteId },
        data: {
          puntos: cliente.puntos - puntosDescontados,
          // ❌ NO tocar puntosAcumulados - se mantienen para el nivel
        },
      });

      // Guardar en el historial de canjes
      const historialCanje = await tx.historialCanje.create({
        data: {
          clienteId: clienteId,
          clienteNombre: cliente.nombre,
          clienteCedula: cliente.cedula,
          recompensaId: recompensaId,
          recompensaNombre: recompensaNombre,
          puntosDescontados: puntosDescontados,
          businessId: cliente.businessId,
          // empleadoId se puede agregar cuando tengamos el sistema de sesiones de admin
        },
      });

      return { clienteActualizado, historialCanje };
    });

    return NextResponse.json({
      success: true,
      message: 'Canje procesado exitosamente',
      data: {
        clienteId: resultado.clienteActualizado.id,
        puntosRestantes: resultado.clienteActualizado.puntos,
        canjeId: resultado.historialCanje.id,
      },
    });

  } catch (error) {
    console.error('Error procesando canje:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
