/**
 * API para gestión individual de Promotores
 * PATCH  /api/promotores/[id] - Actualizar promotor
 * DELETE /api/promotores/[id] - Desactivar promotor (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH - Actualizar promotor
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nombre, telefono, email, activo } = body;

    // Verificar que el promotor existe
    const promotorExistente = await prisma.promotor.findUnique({
      where: { id },
    });

    if (!promotorExistente) {
      return NextResponse.json(
        { error: 'Promotor no encontrado' },
        { status: 404 }
      );
    }

    // Si se está actualizando el nombre, verificar duplicados
    if (nombre && nombre !== promotorExistente.nombre) {
      const duplicado = await prisma.promotor.findFirst({
        where: {
          businessId: promotorExistente.businessId,
          nombre: nombre.trim(),
          id: { not: id },
        },
      });

      if (duplicado) {
        return NextResponse.json(
          { error: 'Ya existe un promotor con ese nombre' },
          { status: 409 }
        );
      }
    }

    // Actualizar promotor
    const promotorActualizado = await prisma.promotor.update({
      where: { id },
      data: {
        ...(nombre && { nombre: nombre.trim() }),
        ...(telefono !== undefined && { telefono: telefono?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(activo !== undefined && { activo }),
      },
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Promotor actualizado exitosamente',
      promotor: {
        id: promotorActualizado.id,
        nombre: promotorActualizado.nombre,
        telefono: promotorActualizado.telefono,
        email: promotorActualizado.email,
        activo: promotorActualizado.activo,
        totalReservas: promotorActualizado._count.reservations,
        createdAt: promotorActualizado.createdAt,
        updatedAt: promotorActualizado.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error al actualizar promotor:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un promotor con ese nombre' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar promotor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar promotor (mantiene relación con reservas antiguas)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que el promotor existe
    const promotorExistente = await prisma.promotor.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!promotorExistente) {
      return NextResponse.json(
        { error: 'Promotor no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el promotor (las reservas mantienen la relación por el promotorId)
    // Prisma mantiene la integridad referencial con onDelete: SetNull
    await prisma.promotor.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Promotor eliminado exitosamente. ${promotorExistente._count.reservations} reserva(s) antigua(s) mantienen la referencia.`,
      promotor: {
        id: promotorExistente.id,
        nombre: promotorExistente.nombre,
        totalReservasAsociadas: promotorExistente._count.reservations,
      },
    });
  } catch (error) {
    console.error('Error al eliminar promotor:', error);
    return NextResponse.json(
      { error: 'Error al eliminar promotor' },
      { status: 500 }
    );
  }
}
