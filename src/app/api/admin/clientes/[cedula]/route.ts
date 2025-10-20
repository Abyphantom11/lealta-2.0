import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/clientes/[cedula]
 * Actualizar datos de un cliente
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cedula: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener businessId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessId: true, role: true }
    });

    if (!user?.businessId || user.role === 'STAFF') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { cedula } = params;
    const body = await request.json();
    const { nombre, correo, telefono, puntos, nuevaCedula } = body;

    // Buscar cliente por cédula o ID (compatibilidad)
    const searchCondition = cedula.startsWith('cl') && cedula.length > 20
      ? { id: cedula }
      : { cedula: cedula };

    const cliente = await prisma.cliente.findFirst({
      where: {
        ...searchCondition,
        businessId: user.businessId
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Si se está cambiando la cédula, verificar que no exista
    if (nuevaCedula && nuevaCedula !== cliente.cedula) {
      const existingCliente = await prisma.cliente.findFirst({
        where: {
          cedula: nuevaCedula,
          businessId: user.businessId,
          id: { not: cliente.id }
        }
      });

      if (existingCliente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con esa cédula' },
          { status: 400 }
        );
      }
    }

    // Actualizar cliente
    const updatedCliente = await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        nombre: nombre || cliente.nombre,
        cedula: nuevaCedula || cliente.cedula,
        correo: correo || cliente.correo,
        telefono: telefono || cliente.telefono,
        puntos: puntos !== undefined ? puntos : cliente.puntos
      }
    });

    return NextResponse.json({
      success: true,
      cliente: {
        id: updatedCliente.id,
        nombre: updatedCliente.nombre,
        cedula: updatedCliente.cedula,
        correo: updatedCliente.correo,
        telefono: updatedCliente.telefono,
        puntos: updatedCliente.puntos
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clientes/[cedula]
 * Eliminar un cliente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { cedula: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener businessId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessId: true, role: true }
    });

    if (!user?.businessId || user.role === 'STAFF') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { cedula } = params;

    // Buscar cliente por cédula o ID (compatibilidad)
    const searchCondition = cedula.startsWith('cl') && cedula.length > 20
      ? { id: cedula }
      : { cedula: cedula };

    const cliente = await prisma.cliente.findFirst({
      where: {
        ...searchCondition,
        businessId: user.businessId
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar cliente
    await prisma.cliente.delete({
      where: { id: cliente.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
