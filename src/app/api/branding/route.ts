import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // console.log('🎨 GET /api/branding - Request received');
    
    // 🔥 CRÍTICO: Obtener businessId del query param (para rutas públicas) o headers (para rutas autenticadas)
    const queryBusinessId = request.nextUrl.searchParams.get('businessId');
    const headerBusinessId = getBusinessIdFromRequest(request);
    
    const businessId = queryBusinessId || headerBusinessId;
    
    // console.log('🎨 GET - BusinessId sources:', {
    //   queryBusinessId,
    //   headerBusinessId,
    //   finalBusinessId: businessId,
    //   fullUrl: request.url
    // });
    
    if (!businessId) {
      console.error('❌ GET - Missing business ID');
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }
    
    // console.log(`🎨 Branding request for business: ${businessId}`);
    
    // Obtener información del business
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      return NextResponse.json(
        { 
          error: 'Negocio no encontrado',
          businessId: businessId
        },
        { status: 404 }
      );
    }

    // console.log(`🎨 GET - Business found:`, {
    //   id: business.id,
    //   name: business.name,
    //   slug: business.slug
    // });

    // Obtener configuración de branding desde la nueva tabla BrandingConfig
    const brandingConfig = await prisma.brandingConfig.findUnique({
      where: { businessId }
    });

    // console.log(`🔍 Branding config from database:`, brandingConfig);
      
    const finalConfig = {
      businessName: brandingConfig?.businessName || business.name || '',
      primaryColor: brandingConfig?.primaryColor || '#8B5CF6',
      secondaryColor: brandingConfig?.secondaryColor || '#7C3AED',
      accentColor: brandingConfig?.accentColor || '#F59E0B',
      logoUrl: brandingConfig?.logoUrl || '',
      carouselImages: brandingConfig?.carouselImages || []
    };

    console.log(`✅ GET - Final branding config:`, {
      businessName: finalConfig.businessName,
      primaryColor: finalConfig.primaryColor,
      carouselImagesCount: finalConfig.carouselImages.length,
      source: 'database'
    });

    console.log(`✅ Branding loaded from DATABASE for business ${businessId}:`, {
      businessName: finalConfig.businessName,
      carouselImagesCount: finalConfig.carouselImages.length,
      source: 'database'
    });
    
    return NextResponse.json(finalConfig);
  } catch (error) {
    console.error('Error loading branding from database:', error);
    return NextResponse.json(
      { error: 'Error loading branding' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 POST /api/branding - Iniciando request');
    
    let branding;
    try {
      branding = await request.json();
    } catch (jsonError) {
      console.error('❌ Error parsing JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    console.log('📦 Branding data received:', {
      businessName: branding?.businessName,
      primaryColor: branding?.primaryColor,
      carouselImagesCount: branding?.carouselImages?.length || 0,
      businessIdInBody: branding?.businessId
    });
    
    // 🔥 CRÍTICO: Obtener businessId de múltiples fuentes
    const queryBusinessId = request.nextUrl.searchParams.get('businessId');
    const headerBusinessId = getBusinessIdFromRequest(request);
    const bodyBusinessId = branding?.businessId;
    
    // Prioridad: query > header > body
    const businessId = queryBusinessId || headerBusinessId || bodyBusinessId;
    
    console.log('🏢 Business ID sources:', {
      queryBusinessId,
      headerBusinessId,
      bodyBusinessId,
      finalBusinessId: businessId
    });
    
    if (!businessId) {
      console.error('❌ Missing business ID from all sources');
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    // Validar datos
    if (!branding.businessName || !branding.primaryColor) {
      console.error('❌ Missing required fields:', {
        hasBusinessName: !!branding.businessName,
        hasPrimaryColor: !!branding.primaryColor
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar que el business existe
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      console.error('❌ Business not found:', businessId);
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Crear o actualizar la configuración de branding
    const brandingData = {
      businessId,
      businessName: branding.businessName,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor || '#7C3AED',
      accentColor: branding.accentColor || '#F59E0B',
      logoUrl: branding.logoUrl || '',
      carouselImages: branding.carouselImages || []
    };

    const savedBranding = await prisma.brandingConfig.upsert({
      where: { businessId },
      update: brandingData,
      create: brandingData
    });

    console.log('✅ Branding saved successfully:', {
      id: savedBranding.id,
      businessName: savedBranding.businessName,
      primaryColor: savedBranding.primaryColor,
      carouselImagesCount: savedBranding.carouselImages.length
    });

    return NextResponse.json({
      success: true,
      branding: savedBranding
    });

  } catch (error) {
    console.error('Error saving branding to database:', error);
    return NextResponse.json(
      { error: 'Error saving branding' },
      { status: 500 }
    );
  }
}
