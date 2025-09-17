import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BRANDING_FILE = path.join(process.cwd(), 'branding-config.json');

export async function GET(request: NextRequest) {
  try {
    // 🔥 CRÍTICO: Obtener businessId para business isolation
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId') || 'default';
    
    console.log(`🎨 Branding request for business: ${businessId}`);
    
    // Usar archivo específico del negocio
    const businessBrandingFile = path.join(process.cwd(), `branding-config-${businessId}.json`);
    const fallbackBrandingFile = BRANDING_FILE; // branding-config.json
    
    let brandingFile = businessBrandingFile;
    
    // Si no existe el archivo específico, usar el general como fallback
    if (!fs.existsSync(businessBrandingFile)) {
      console.log(`⚠️ Business-specific branding not found for ${businessId}, using fallback`);
      brandingFile = fallbackBrandingFile;
    }

    if (fs.existsSync(brandingFile)) {
      const data = fs.readFileSync(brandingFile, 'utf8');
      const branding = JSON.parse(data);
      
      console.log(`✅ Branding loaded for business ${businessId}:`, {
        businessName: branding.businessName,
        hasImages: branding.carouselImages?.length > 0
      });
      
      return NextResponse.json(branding);
    } else {
      // Si no existe branding-config.json, intentar obtener el nombre desde portal-config específico del business
      const businessPortalFile = path.join(process.cwd(), `portal-config-${businessId}.json`);
      const fallbackPortalFile = path.join(process.cwd(), 'portal-config.json');
      
      let businessName = 'Mi Empresa'; // Fallback final
      let portalConfigFile = businessPortalFile;
      
      // Intentar archivo específico del business primero
      if (!fs.existsSync(businessPortalFile)) {
        portalConfigFile = fallbackPortalFile;
        console.log(`⚠️ Business portal config not found for ${businessId}, using fallback`);
      }

      try {
        if (fs.existsSync(portalConfigFile)) {
          const portalData = fs.readFileSync(portalConfigFile, 'utf8');
          const portalConfig = JSON.parse(portalData);
          businessName = portalConfig.nombreEmpresa || businessName;
          console.log(`📋 Business name from portal config: ${businessName}`);
        }
      } catch (portalError) {
        console.warn('No se pudo leer portal-config.json:', portalError);
      }

      // Valores por defecto sin imágenes hardcodeadas
      const defaultBranding = {
        businessName,
        primaryColor: '#2563EB',
        carouselImages: [], // Sin imágenes hasta que el admin las configure
      };
      
      console.log(`🎨 Default branding created for business ${businessId}:`, defaultBranding);
      return NextResponse.json(defaultBranding);
    }
  } catch (error) {
    console.error('Error loading branding:', error);
    return NextResponse.json(
      { error: 'Error loading branding' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const branding = await request.json();

    // Validar datos
    if (!branding.businessName || !branding.primaryColor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Asegurar que carouselImages existe como array
    if (!branding.carouselImages) {
      branding.carouselImages = [];
    }

    // Guardar en archivo
    fs.writeFileSync(BRANDING_FILE, JSON.stringify(branding, null, 2));

    // Se ha eliminado console.log por recomendación de SonarQube

    return NextResponse.json({ success: true, branding });
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json(
      { error: 'Error saving branding' },
      { status: 500 }
    );
  }
}
