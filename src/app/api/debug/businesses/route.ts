import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Consultando businesses en la base de datos');
    
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      }
    });

    console.log('🔍 Businesses encontrados:', businesses);

    return NextResponse.json({
      success: true,
      businesses: businesses
    });
  } catch (error) {
    console.error('Error consultando businesses:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
