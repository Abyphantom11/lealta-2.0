import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { businessName: string } }
) {
  try {
    const businessName = decodeURIComponent(params.businessName);
    
    console.log(`🔍 Buscando negocio por nombre: "${businessName}"`);
    
    // Primero buscar por subdomain exacto
    let business = await prisma.business.findFirst({
      where: {
        subdomain: businessName
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        subscriptionPlan: true,
        isActive: true
      }
    });
    
    // Si no se encuentra por subdomain, buscar por nombre similar
    if (!business) {
      console.log(`⚠️ No encontrado por subdomain, buscando por nombre...`);
      
      business = await prisma.business.findFirst({
        where: {
          OR: [
            {
              name: {
                contains: businessName,
                mode: 'insensitive'
              }
            },
            {
              subdomain: {
                contains: businessName.toLowerCase().replace(/\s+/g, ''),
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          subscriptionPlan: true,
          isActive: true
        }
      });
    }
    
    if (!business) {
      console.log(`❌ Negocio no encontrado: "${businessName}"`);
      
      // Listar negocios disponibles para debug
      const availableBusinesses = await prisma.business.findMany({
        select: {
          id: true,
          name: true,
          subdomain: true
        },
        take: 5
      });
      
      console.log('📋 Negocios disponibles:');
      availableBusinesses.forEach((b: any) => {
        console.log(`  - ${b.name} (${b.subdomain}) - ID: ${b.id}`);
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Negocio no encontrado',
          searchedFor: businessName,
          availableBusinesses: availableBusinesses.map((b: any) => ({
            name: b.name,
            subdomain: b.subdomain
          }))
        },
        { status: 404 }
      );
    }
    
    console.log(`✅ Negocio encontrado: ${business.name} (ID: ${business.id})`);
    
    return NextResponse.json({
      success: true,
      data: business
    });
    
  } catch (error) {
    console.error('❌ Error en /api/businesses/by-name:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
