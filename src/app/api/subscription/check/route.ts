/**
 * API para verificar el estado de suscripción de un negocio
 * 
 * GET /api/subscription/check?businessId=xxx
 * 
 * Usado por el frontend para:
 * - Mostrar banners de advertencia
 * - Verificar acceso antes de acciones críticas
 * - Actualizar UI según estado de suscripción
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkBusinessAccess } from '@/lib/subscription-control';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tenga acceso a este negocio
    // (Aquí deberías agregar validación de permisos si es necesario)

    const access = await checkBusinessAccess(businessId);

    return NextResponse.json({
      success: true,
      access,
    });
  } catch (error) {
    console.error('Error checking subscription:', error);
    
    return NextResponse.json(
      { 
        error: 'Error verificando suscripción',
        // En caso de error, devolver acceso por seguridad
        access: {
          hasAccess: true,
          status: 'legacy',
          message: 'Error verificando acceso',
        }
      },
      { status: 500 }
    );
  }
}
