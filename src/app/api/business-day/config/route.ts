import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Forzar renderizado dinámico para esta ruta
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Hora de reseteo por defecto (4 AM estándar para bares/restaurantes)
const DEFAULT_RESET_HOUR = 4;

/**
 * GET /api/business-day/config
 * Obtiene la configuración del día comercial para un business
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId es requerido' }, { status: 400 });
    }

    // Obtener configuración desde base de datos
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { settings: true }
    });

    // Extraer configuración de día comercial del campo settings
    const settings = business?.settings as any || {};
    const dayConfig = settings.businessDay || {};
    
    const config = {
      businessId,
      resetHour: dayConfig.resetHour ?? DEFAULT_RESET_HOUR,
      resetMinute: dayConfig.resetMinute ?? 0,
      timezone: dayConfig.timezone || 'America/Guayaquil'
    };

    return NextResponse.json(config);

  } catch (error) {
    console.error('❌ Error obteniendo configuración de día comercial:', error);
    
    // Retornar configuración por defecto
    const fallbackConfig = {
      businessId: request.nextUrl.searchParams.get('businessId'),
      resetHour: DEFAULT_RESET_HOUR,
      resetMinute: 0,
      timezone: 'America/Guayaquil'
    };

    return NextResponse.json(fallbackConfig);
  }
}

/**
 * PUT /api/business-day/config
 * Actualiza la configuración del día comercial para un business
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, resetHour, resetMinute, timezone } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId es requerido' }, { status: 400 });
    }

    // Obtener settings actuales
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { settings: true }
    });

    const currentSettings = business?.settings as any || {};
    
    // Actualizar configuración de día comercial
    const updatedSettings = {
      ...currentSettings,
      businessDay: {
        resetHour: resetHour ?? DEFAULT_RESET_HOUR,
        resetMinute: resetMinute ?? 0,
        timezone: timezone || 'America/Guayaquil'
      }
    };

    await prisma.business.update({
      where: { id: businessId },
      data: { settings: updatedSettings }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración de día comercial actualizada',
      config: updatedSettings.businessDay
    });

  } catch (error) {
    console.error('❌ Error actualizando configuración de día comercial:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
