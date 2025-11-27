import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/requireAuth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clientes/count
 * Obtener cantidad de clientes con teléfono para un negocio
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request, {
      allowedRoles: ['admin', 'superadmin', 'staff']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId es requerido' }, { status: 400 });
    }

    // Contar clientes con teléfono válido
    const count = await prisma.cliente.count({
      where: {
        businessId,
        telefono: { 
          not: '',
        },
      }
    });

    // También obtener cuántos ya recibieron mensaje (opcional para el futuro)
    const totalClientes = await prisma.cliente.count({
      where: { businessId }
    });

    return NextResponse.json({
      success: true,
      count, // Clientes con teléfono
      totalClientes, // Todos los clientes
      sinTelefono: totalClientes - count,
    });

  } catch (error: any) {
    console.error('❌ Error contando clientes:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
