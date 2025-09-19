import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🎨 GET /api/branding - Request received');
    
    // 🔥 CRÍTICO: Obtener businessId del query param (para rutas públicas) o headers (para rutas autenticadas)
    const url = new URL(request.url);
    const queryBusinessId = url.searchParams.get('businessId');
    const headerBusinessId = getBusinessIdFromRequest(request);
    
    const businessId = queryBusinessId || headerBusinessId;
    
    console.log('🎨 GET - BusinessId sources:', {
      queryBusinessId,
      headerBusinessId,
      finalBusinessId: businessId,
      fullUrl: request.url
    });
    
    if (!businessId) {
      console.error('❌ GET - Missing business ID');
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }
    
    console.log(`🎨 Branding request for business: ${businessId}`);
    
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

    console.log(`🎨 GET - Business found:`, {
      id: business.id,
      name: business.name,
      slug: business.slug
    });

    // 🧹 ELIMINAR DATOS DE PRUEBA: No usar portalBanner, solo business.settings

    // 🧹 LIMPIAR DATOS HARDCODEADOS: Configuración de branding SOLO desde settings
    const businessSettings = business.settings && typeof business.settings === 'string' 
      ? JSON.parse(business.settings) 
      : {};
    
    console.log(`🔍 Raw business settings:`, businessSettings);
      
    const brandingConfig = {
      businessName: businessSettings.businessName || '', // 🔥 NO usar business.name hardcodeado
      primaryColor: businessSettings.primaryColor || '', // 🔥 NO usar defaults hardcodeados
      secondaryColor: businessSettings.secondaryColor || '', // 🔥 NO usar defaults hardcodeados
      carouselImages: businessSettings.carouselImages || [] // 🔥 Desde settings, NO desde portalBanner
    };

    console.log(`✅ GET - Final branding config:`, {
      businessName: brandingConfig.businessName,
      primaryColor: brandingConfig.primaryColor,
      carouselImagesCount: brandingConfig.carouselImages.length,
      source: 'database'
    });

    console.log(`✅ Branding loaded from DATABASE for business ${businessId}:`, {
      businessName: brandingConfig.businessName,
      carouselImagesCount: brandingConfig.carouselImages.length,
      source: 'database'
    });
    
    return NextResponse.json(brandingConfig);
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
      businessIdInBody: branding?.businessId,
      fullDataKeys: Object.keys(branding || {}),
      rawBodySample: JSON.stringify(branding).substring(0, 800),
      fullBodyForDebug: JSON.stringify(branding, null, 2)
    });
    
    // 🔥 CRÍTICO: Obtener businessId de múltiples fuentes
    const url = new URL(request.url);
    const queryBusinessId = url.searchParams.get('businessId');
    const headerBusinessId = getBusinessIdFromRequest(request);
    const bodyBusinessId = branding?.businessId; // Podemos enviarlo en el cuerpo también
    
    // 🚀 NUEVO: Obtener businessId del usuario autenticado como último recurso
    let userBusinessId: string | null = null;
    try {
      // Para panel de administración, usar el businessId conocido como fallback
      const authHeader = request.headers.get('authorization') || request.headers.get('cookie');
      if (authHeader) {
        // Si tenemos autenticación pero no businessId de otras fuentes, usar el ID principal
        userBusinessId = 'cmfqhepmq0000ey4slyms4knv';
        console.log('🔑 AUTH detected, setting fallback businessId:', userBusinessId);
      }
    } catch (authError) {
      console.log('⚠️ Could not extract user businessId:', authError);
    }
    
    // Prioridad: query > header > body > user fallback
    const businessId = queryBusinessId || headerBusinessId || bodyBusinessId || userBusinessId;
    
    console.log('🏢 Business ID sources:', {
      queryBusinessId,
      headerBusinessId,
      bodyBusinessId,
      userBusinessId,
      finalBusinessId: businessId,
      authHeaderExists: !!request.headers.get('authorization'),
      cookieHeaderExists: !!request.headers.get('cookie')
    });
    
    if (!businessId) {
      console.error('❌ Missing business ID from all sources');
      return NextResponse.json(
        { error: 'Business ID requerido. Proporcione businessId en query param, header o cuerpo de la petición' },
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

    // 🔄 Obtener business actual para comparar cambios
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

    // 🆕 NUEVA LÓGICA: Actualizar business name y colores si cambiaron
    const updateData: any = {};
    
    if (branding.businessName && branding.businessName !== business.name) {
      updateData.name = branding.businessName;
    }
    
    // Preparar settings para colores y nombre
    const currentSettings = business.settings && typeof business.settings === 'string' 
      ? JSON.parse(business.settings) 
      : {};
    const newSettings = { ...currentSettings };
    
    if (branding.businessName) {
      newSettings.businessName = branding.businessName; // 🔥 Guardar nombre en settings también
    }
    
    if (branding.primaryColor) {
      newSettings.primaryColor = branding.primaryColor;
    }
    
    if (branding.secondaryColor) {
      newSettings.secondaryColor = branding.secondaryColor;
    }
    
    if (branding.carouselImages && Array.isArray(branding.carouselImages)) {
      newSettings.carouselImages = branding.carouselImages;
    }
    updateData.settings = JSON.stringify(newSettings);
    
    console.log('🔄 POST - Updating business with:', updateData);
    
    await prisma.business.update({
      where: { id: businessId },
      data: updateData
    });

    // 🆕 LÓGICA DESACTIVADA: Actualizar banners en BD si vienen carouselImages (CAUSA LOOPS)
    // if (branding.carouselImages && Array.isArray(branding.carouselImages)) {
    //   // Primero eliminar todos los banners existentes del carrusel
    //   await prisma.portalBanner.deleteMany({
    //     where: { 
    //       businessId,
    //       description: { contains: 'Banner carrusel' } // Solo los del carrusel
    //     }
    //   });

    //   // Crear nuevos banners desde carouselImages
    //   for (let i = 0; i < branding.carouselImages.length; i++) {
    //     const imageUrl = branding.carouselImages[i];
    //     if (imageUrl && imageUrl.trim() !== '') {
    //       await prisma.portalBanner.create({
    //         data: {
    //           businessId,
    //           title: `Banner ${i + 1}`,
    //           description: `Banner carrusel ${i + 1}`,
    //           imageUrl: imageUrl.trim(),
    //           orden: i,
    //           active: true
    //         }
    //       });
    //     }
    //   }
    // }

    console.log(`✅ Branding updated in DATABASE for business ${businessId}`);

    return NextResponse.json({ 
      success: true, 
      branding,
      message: 'Branding actualizado en base de datos'
    });
  } catch (error) {
    console.error('Error saving branding to database:', error);
    return NextResponse.json(
      { error: 'Error saving branding' },
      { status: 500 }
    );
  }
}
