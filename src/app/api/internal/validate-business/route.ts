import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * API interna para validar negocios
 * Solo acepta requests internos del middleware
 */
export async function GET(request: NextRequest) {
  // Verificar que es un request interno
  const internalHeader = request.headers.get('x-internal-request');
  if (internalHeader !== 'true') {
    return NextResponse.json(
      { error: 'Forbidden - Internal API' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json(
      { error: 'businessId parameter required' },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 API Internal: Validando business "${businessId}"`);
    
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessId },
          { slug: businessId },
          { subdomain: businessId }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        isActive: true
      }
    });

    if (!business) {
      console.log(`❌ API Internal: Business "${businessId}" no encontrado o inactivo`);
      return NextResponse.json(
        { error: 'Business not found or inactive' },
        { status: 404 }
      );
    }

    console.log(`✅ API Internal: Business "${businessId}" encontrado:`, business);
    return NextResponse.json(business);
    
  } catch (error) {
    console.error('❌ API Internal: Error validating business:', error);
    return NextResponse.json(
      { error: 'Database error' },
      { status: 500 }
    );
  }
}
