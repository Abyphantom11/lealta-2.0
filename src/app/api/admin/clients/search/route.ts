import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { searchTerm } = await request.json();

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({
        success: true,
        clients: [],
        message: 'Término de búsqueda muy corto'
      });
    }

    // Buscar clientes por nombre, correo o cédula
    const clients = await prisma.cliente.findMany({
      where: {
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
    });

  } catch (error) {
    console.error('Error buscando clientes:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor', clients: [] },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
