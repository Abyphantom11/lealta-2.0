import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

/**
 * API para configurar business routing
 * POST /api/setup/business-routing
 */
export async function POST() {
  try {
    console.log('🔧 Configurando routing de negocios...');

    // Verificar si business_1 existe
    const mainBusiness = await prisma.business.findUnique({
      where: { id: 'business_1' }
    });

    if (!mainBusiness) {
      // Crear el negocio principal
      console.log('🏪 Creando negocio principal...');
      
      await prisma.business.create({
        data: {
          id: 'business_1',
          name: 'Café Central Demo',
          subdomain: 'demo',
          slug: 'demo-business',
          isActive: true,
          settings: {
            contactEmail: 'demo@cafecentral.com',
            phone: '555-0123'
          }
        }
      });
      
      console.log('✅ Negocio principal creado');
    } else if (!mainBusiness.subdomain) {
      // Actualizar negocio existente con subdomain
      console.log('🔧 Agregando subdomain a business_1...');
      
      await prisma.business.update({
        where: { id: 'business_1' },
        data: {
          subdomain: 'demo',
          slug: mainBusiness.slug || 'demo-business'
        }
      });
      
      console.log('✅ Subdomain agregado');
    }

    // Obtener configuración final
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        slug: true,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Business routing configurado correctamente',
      businesses,
      routes: [
        '/demo/admin - Panel de administración',
        '/demo/staff - Panel de staff', 
        '/demo/cliente - Portal cliente'
      ]
    });

  } catch (error) {
    console.error('❌ Error configurando business routing:', error);
    
    return NextResponse.json(
      { 
        error: 'Error configurando business routing', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
