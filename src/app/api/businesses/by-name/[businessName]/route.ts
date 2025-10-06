import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { businessName: string } }
) {
  try {
    const businessName = decodeURIComponent(params.businessName);

    const business = await prisma.business.findFirst({
      where: {
        name: {
          equals: businessName,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error buscando negocio por nombre:', error);
    return NextResponse.json(
      { error: 'Error al buscar negocio' },
      { status: 500 }
    );
  }
}
