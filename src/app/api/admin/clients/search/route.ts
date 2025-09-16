import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthConfigs } from '../../../../../middleware/requireAuth';

const prisma = new PrismaClient();

// 🔒 POST - Búsqueda de clientes (PROTEGIDO - READ_ONLY)
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🔍 Client search by: ${session.role} (${session.userId})`);
      
      const { searchTerm } = await request.json();

      if (!searchTerm || searchTerm.length < 2) {
        return NextResponse.json({
          success: true,
          clients: [],
          message: 'Término de búsqueda muy corto'
        });
      }

      // 🔒 Buscar clientes por nombre, correo o cédula SOLO del business del usuario
      const clients = await prisma.cliente.findMany({
      where: {
        businessId: session.businessId, // ✅ FILTRO POR BUSINESS SECURITY
        OR: [
          {
            nombre: {
              contains: searchTerm,
            },
          },
          {
            correo: {
              contains: searchTerm,
            },
          },
          {
            cedula: {
              contains: searchTerm,
            },
          },
          {
            telefono: {
              contains: searchTerm,
            },
          },
        ],
      },
      orderBy: [
        { nombre: 'asc' },
      ],
      take: 20, // Limitar a 20 resultados para mejor rendimiento
      select: {
        id: true,
        nombre: true,
        correo: true,
        cedula: true,
        telefono: true,
        puntos: true,
        totalGastado: true,
        totalVisitas: true,
      },
    });

    // Mapear campos para compatibilidad
    const clientsMapped = clients.map(client => ({
      ...client,
      email: client.correo, // Mapear correo a email para compatibilidad
    }));

    return NextResponse.json({
      success: true,
      clients: clientsMapped,
      total: clientsMapped.length,
      searchedBy: session.userId, // ✅ AUDITORÍA
      businessId: session.businessId
    });

  } catch (error) {
    console.error('❌ Error buscando clientes:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', clients: [] },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
  }, AuthConfigs.READ_ONLY);
}
