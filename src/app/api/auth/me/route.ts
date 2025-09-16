import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth/unified-middleware';

// Forzar renderizado dinámico para esta ruta que usa cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Usar el middleware unificado para obtener el usuario
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Retornar datos del usuario (el middleware ya verificó todo)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        business: user.business,
      },
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
