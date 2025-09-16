// src/app/api/business/info/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  subdomain: z.string().min(1, 'Subdomain is required'),
});

/**
 * GET - Obtener información de un business por subdomain
 * Usado por el hook useBusiness para cargar contexto
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    const validatedQuery = querySchema.parse({ subdomain });

    // Buscar business por subdomain
    const business = await prisma.business.findUnique({
      where: {
        subdomain: validatedQuery.subdomain,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        subscriptionPlan: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...business
    });

  } catch (error) {
    console.error('Error fetching business info:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
