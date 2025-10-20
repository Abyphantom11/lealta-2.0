import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

export const dynamic = 'force-dynamic';

/**
 * POST /api/clientes/[cedula]/update-name
 * Actualizar el nombre de un cliente
 * 
 * Soporta tanto cédula como ID para compatibilidad con código legacy
 */
export async function POST(
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

    const { cedula } = params;
    const { nombre } = await request.json();

    if (!nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    // Buscar cliente por cédula o ID
    // Si el parámetro parece un ID de Prisma (empieza con 'cl' y tiene más de 20 caracteres),
    // buscar por ID para compatibilidad con código legacy
    const searchCondition = cedula.startsWith('cl') && cedula.length > 20
      ? { id: cedula }
      : { cedula: cedula };

    const cliente = await prisma.cliente.findFirst({
      where: searchCondition
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar nombre
    const updatedCliente = await prisma.cliente.update({
      where: { id: cliente.id },
      data: { nombre }
    });

    return NextResponse.json({
      success: true,
      cliente: {
        id: updatedCliente.id,
        nombre: updatedCliente.nombre,
        cedula: updatedCliente.cedula
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando nombre del cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
