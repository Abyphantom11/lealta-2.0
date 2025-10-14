import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Función para obtener banners desde archivo de configuración central
async function getBannersFromConfig(businessId: string) {
  try {
    // Intentar archivo específico del business primero
    const specificPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${businessId}.json`);
    const defaultPath = path.join(process.cwd(), 'portal-config.json');
    
    let configPath = defaultPath;
    if (fs.existsSync(specificPath)) {
      configPath = specificPath;
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    
    return config.banners || [];
  } catch (error) {
    console.error('❌ [BANNERS] Error leyendo configuración:', error);
    return [];
  }
}

// GET - Obtener banners del portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 🔧 FIX: Priorizar query parameter para producción
    const businessIdFromQuery = searchParams.get('businessId');
    const businessIdFromHeader = getBusinessIdFromRequest(request);
    const businessId = businessIdFromQuery || businessIdFromHeader;
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    console.log(`🏢 [BANNERS] Using businessId: ${businessId} (from: ${businessIdFromQuery ? 'query' : 'header'})`);

    // 🎯 PRIORIDAD CORREGIDA: Usar base de datos primero (fuente de verdad)
    const banners = await prisma.portalBanner.findMany({
      where: {
        businessId,
        active: true
      },
      orderBy: {
        orden: 'asc'
      }
    });

    if (banners.length > 0) {
      // Transformar a formato compatible con cliente
      const bannersFormatted = banners.map(banner => ({
        id: banner.id,
        titulo: banner.title,
        title: banner.title,
        descripcion: banner.description || '',
        description: banner.description || '',
        imagenUrl: banner.imageUrl || '',
        imageUrl: banner.imageUrl || '',
        activo: banner.active,
        active: banner.active,
        orden: banner.orden || 0,
        dia: banner.dia || 'todos', // Si no tiene día específico
        linkUrl: banner.linkUrl || ''
      }));
      
      return NextResponse.json({ banners: bannersFormatted });
    }
    
    // Fallback: usar configuración JSON solo si no hay datos en BD
    const configBanners = await getBannersFromConfig(businessId);
    
    return NextResponse.json({ banners: configBanners });
  } catch (error) {
    console.error('Error obteniendo banners:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo banner (solo admin)
export async function POST(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, imageUrl, linkUrl, orden = 0 } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Título es requerido' },
        { status: 400 }
      );
    }

    const banner = await prisma.portalBanner.create({
      data: {
        businessId,
        title,
        description,
        imageUrl,
        linkUrl,
        orden,
        active: true
      }
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('Error creando banner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar banner existente (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { id, title, description, imageUrl, linkUrl, active, orden } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID del banner es requerido' },
        { status: 400 }
      );
    }

    const banner = await prisma.portalBanner.update({
      where: {
        id,
        businessId // Verificar que pertenece al business
      },
      data: {
        title,
        description,
        imageUrl,
        linkUrl,
        active,
        orden
      }
    });

    return NextResponse.json({ banner });
  } catch (error) {
    console.error('Error actualizando banner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar banner (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID del banner es requerido' },
        { status: 400 }
      );
    }

    await prisma.portalBanner.delete({
      where: {
        id,
        businessId // Verificar que pertenece al business
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error eliminando banner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
