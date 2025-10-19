import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  try {
    const { clienteId } = params;
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido y debe ser válido' },
        { status: 400 }
      );
    }

    // Actualizar el nombre del cliente en la base de datos
    const updatedCliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: { nombre: nombre.trim() },
    });

    // 🔄 También actualizar el campo customerName en todas las reservas de este cliente
    // para que se refleje inmediatamente sin necesidad de refrescar
    const updatedReservations = await prisma.reservation.updateMany({
      where: { clienteId: clienteId },
      data: { customerName: nombre.trim() },
    });

    console.log('✅ Cliente actualizado:', updatedCliente.id);
    console.log('✅ Reservas actualizadas:', updatedReservations.count);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCliente.id,
        nombre: updatedCliente.nombre,
        reservasActualizadas: updatedReservations.count,
      },
    });
  } catch (error) {
    console.error('Error al actualizar nombre del cliente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el nombre del cliente' },
      { status: 500 }
    );
  }
}
