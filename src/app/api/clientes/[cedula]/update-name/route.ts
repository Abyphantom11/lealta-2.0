import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Este endpoint ya no se usa.
 * El nombre del cliente se actualiza directamente en la reserva (customerName).
 * 
 * Usar: PUT /api/reservas/[id]?businessId=xxx con { customerName: "nuevo nombre" }
 */

export async function POST() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Este endpoint está deprecado. Usa PUT /api/reservas/[id] con customerName',
      deprecatedSince: '2025-10-20'
    },
    { status: 410 } // 410 Gone - recurso ya no disponible
  );
}

// Agregar soporte para PATCH para evitar error 405
export async function PATCH() {
  return POST();
}
