import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 🔒 SECURITY: Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json(
        { error: 'No autorizado - Business ID requerido' },
        { status: 401 }
      );
    }

    const businessId = session.user.businessId;

    // 🔒 SECURITY: Obtener SOLO clientes del business del usuario autenticado
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: businessId, // ✅ FILTRO CRÍTICO POR BUSINESS
      },
      orderBy: {
        registeredAt: 'desc',
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        telefono: true,
        correo: true,
        puntos: true,
        totalVisitas: true,
        totalGastado: true,
        registeredAt: true,
        lastLogin: true,
        tarjetaLealtad: {
          select: {
            nivel: true,
            activa: true,
            asignacionManual: true,
            fechaAsignacion: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      clientes,
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
