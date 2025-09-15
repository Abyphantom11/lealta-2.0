import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BRANDING_FILE = path.join(process.cwd(), 'branding-config.json');

export async function GET() {
  try {
    if (fs.existsSync(BRANDING_FILE)) {
      const data = fs.readFileSync(BRANDING_FILE, 'utf8');
      const branding = JSON.parse(data);
      return NextResponse.json(branding);
    } else {
      // Si no existe branding-config.json, intentar obtener el nombre desde portal-config.json
      const portalConfigFile = path.join(process.cwd(), 'portal-config.json');
      let businessName = 'Mi Empresa'; // Fallback final

      try {
        if (fs.existsSync(portalConfigFile)) {
          const portalData = fs.readFileSync(portalConfigFile, 'utf8');
          const portalConfig = JSON.parse(portalData);
          businessName = portalConfig.nombreEmpresa || businessName;
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
