import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/requireAuth';

export const dynamic = 'force-dynamic';

/**
 * API UNIFICADA DE RESOLUCIÓN DE BUSINESS
 * 
 * Esta API es el ÚNICO punto de entrada para resolver un business slug/subdomain/id
 * a un businessId válido con validaciones de seguridad.
 * 
 * Flujo:
 * 1. Recibe slug (puede ser: subdomain, slug, o id)
 * 2. Busca en base de datos
 * 3. Valida que el usuario tiene acceso
 * 4. Valida que el business está activo
 * 5. Retorna datos completos del business
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  return withAuth(request, async (session) => {
    try {
      const { slug } = params;

      console.log('🔍 RESOLVE BUSINESS:', {
        slug,
        userId: session.userId,
        userRole: session.role,
        sessionBusinessId: session.businessId,
      });

      // Buscar business por slug, subdomain o ID
      const business = await prisma.business.findFirst({
        where: {
          OR: [
            { slug: slug },
            { subdomain: slug },
            { id: slug }, // Por si acaso pasan el ID directamente
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          subdomain: true,
          isActive: true,
        },
      });

      if (!business) {
        console.error('❌ Business not found:', slug);
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }

      // VALIDACIÓN DE SEGURIDAD: Usuario debe tener acceso al business
      // SuperAdmin puede acceder a cualquier business
      if (session.role !== 'superadmin' && session.businessId !== business.id) {
        console.error('❌ Access denied:', {
          userId: session.userId,
          userRole: session.role,
          requestedBusiness: business.id,
          userBusiness: session.businessId,
        });
        return NextResponse.json(
          { error: 'Access denied to this business' },
          { status: 403 }
        );
      }

      // Validar que el business está activo
      if (!business.isActive) {
        console.error('❌ Business inactive:', business.id);
        return NextResponse.json(
          { error: 'Business is inactive' },
          { status: 403 }
        );
      }

      console.log('✅ Business resolved successfully:', {
        id: business.id,
        name: business.name,
        slug: business.slug,
      });

      return NextResponse.json({
        id: business.id,
        name: business.name,
        slug: business.slug,
        subdomain: business.subdomain,
      });
    } catch (error) {
      console.error('❌ Error resolving business:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
