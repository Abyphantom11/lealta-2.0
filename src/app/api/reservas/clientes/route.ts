import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthConfigs } from '@/middleware/requireAuth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    const businessId = session.businessId;
    
    // Obtener todos los clientes del negocio
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: businessId
      },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        correo: true,
      }
    });
    
    // Promotores - retornar vacío si no existe la tabla
    const promotores: any[] = [];
    
    return NextResponse.json({ clientes, promotores });
  }, AuthConfigs.READ_ONLY);
}
