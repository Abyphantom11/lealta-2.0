import { NextResponse } from 'next/server';
import { Reserva } from '../../../reservas/types/reservation';

// VERSIÓN TEMPORAL SIN PRISMA
// Usar archivo compartido para almacenamiento en memoria (simulado con export)

export const dynamic = 'force-dynamic';

// GET /api/reservas/[id] - Obtener una reserva específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
    
    console.log('📦 GET /api/reservas/[id] - ID:', reservationId);

    // Por ahora retornar 404 ya que no tenemos acceso a reservasEnMemoria aquí
    // Una vez Prisma funcione, este archivo será reemplazado
    return NextResponse.json({ 
      error: 'Función no disponible temporalmente. Espere regeneración de Prisma.' 
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Error fetching reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/reservas/[id] - Actualizar una reserva
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
    const updates = await request.json() as Partial<Reserva>;
    
    console.log('✏️ PUT /api/reservas/[id] - ID:', reservationId);
    console.log('📝 Updates:', updates);

    // Por ahora retornar 501 Not Implemented
    return NextResponse.json({ 
      error: 'Función no disponible temporalmente. Espere regeneración de Prisma.',
      message: 'Las ediciones en tabla están deshabilitadas hasta que se regenere el cliente de Prisma.'
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Error updating reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/reservas/[id] - Eliminar una reserva
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
    
    console.log('🗑️ DELETE /api/reservas/[id] - ID:', reservationId);

    // Por ahora retornar 501 Not Implemented
    return NextResponse.json({ 
      error: 'Función no disponible temporalmente. Espere regeneración de Prisma.'
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Error deleting reserva:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
