import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

/**
 * API para validar si un business existe y está activo
 * GET /api/businesses/[businessId]/validate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    console.log(`🔍 Validating business: ${businessId}`);

    // Buscar el business por ID o subdomain
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessId },
          { subdomain: businessId },
          { slug: businessId },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        slug: true,
        isActive: true,
      },
    });

    if (!business) {
      console.log(`❌ Business not found: ${businessId}`);
      return NextResponse.json(
        { error: 'Business not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: business.id,
      name: business.name,
      subdomain: business.subdomain,
      slug: business.slug,
      isActive: business.isActive,
    });

  } catch (error) {
    console.error('Error validating business:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
