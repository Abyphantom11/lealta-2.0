import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener el business ID del usuario actual
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { businesses: true },
    });
    
    if (!user || !user.businesses || user.businesses.length === 0) {
      return NextResponse.json({ error: 'Usuario sin negocio asociado' }, { status: 403 });
    }
    
    const businessId = user.businesses[0].id;
    
    // Obtener todos los clientes del negocio
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: businessId
      },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        email: true,
      }
    });
    
    // Obtener todos los promotores (personal con rol de promotor)
    const promotores = await prisma.staffMember.findMany({
      where: {
        businessId: businessId,
        role: 'PROMOTOR'
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    
    return NextResponse.json({ clientes, promotores });
  } catch (error) {
    console.error('Error al obtener clientes y promotores:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
