import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ⚠️ FUNCIONALIDAD NO IMPLEMENTADA
 * 
 * Este endpoint requiere el modelo `TicketReservaAssociation` en el schema de Prisma.
 * Ver instrucciones en: src/app/api/tickets/asociar-reserva/route.ts
 */

// GET /api/reservas/[id]/consumo - Obtener el consumo detallado de una reserva
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { 
      success: false, 
      reservaId: params.id,
      error: 'Funcionalidad no implementada. Requiere modelo TicketReservaAssociation en Prisma schema.',
      documentation: 'Ver src/app/api/tickets/asociar-reserva/route.ts para instrucciones de implementación'
    },
    { status: 501 }
  );
}
