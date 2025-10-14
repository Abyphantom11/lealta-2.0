import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';
import { getBusinessDayDebugInfo } from '@/lib/business-day-utils';

const prisma = new PrismaClient();

// GET - Obtener configuración de día comercial
export async function GET(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    // Obtener configuración de la base de datos
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { settings: true }
    });

    // Extraer configuración de día comercial del campo settings
    const settings = business?.settings as any || {};
    const dayConfig = settings.businessDay || {};
    
    const resetHour = dayConfig.resetHour ?? 4; // Por defecto 4 AM
    const resetMinute = dayConfig.resetMinute ?? 0;
    const timezone = dayConfig.timezone ?? 'local';

    // Por ahora, devolver configuración por defecto y debug info
    const debugInfo = await getBusinessDayDebugInfo(businessId);
    
    return NextResponse.json({
      businessId,
      resetHour,
      resetMinute,
      timezone,
      debug: debugInfo
    });

  } catch (error) {
    console.error('Error obteniendo configuración de día comercial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Actualizar configuración de día comercial
export async function POST(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const { resetHour, resetMinute = 0, timezone = 'local' } = await request.json();

    // Validaciones
    if (typeof resetHour !== 'number' || resetHour < 0 || resetHour > 23) {
      return NextResponse.json(
        { error: 'resetHour debe ser un número entre 0 y 23' },
        { status: 400 }
      );
    }

    if (typeof resetMinute !== 'number' || resetMinute < 0 || resetMinute > 59) {
      return NextResponse.json(
        { error: 'resetMinute debe ser un número entre 0 y 59' },
        { status: 400 }
      );
    }

    // Obtener configuración actual de la base de datos
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { settings: true }
    });

    // Actualizar configuración de día comercial en el campo settings
    const currentSettings = business?.settings as any || {};
    const updatedSettings = {
      ...currentSettings,
      businessDay: {
        resetHour,
        resetMinute,
        timezone,
        updatedAt: new Date().toISOString()
      }
    };

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: { 
        settings: updatedSettings,
        updatedAt: new Date()
      },
      select: { id: true, name: true }
    });

    console.log(`✅ Configuración de día comercial actualizada para ${businessId} (${updatedBusiness.name}):`, {
      resetHour,
      resetMinute,
      resetTime: `${resetHour}:${resetMinute.toString().padStart(2, '0')}`
    });

    return NextResponse.json({
      success: true,
      businessId,
      businessName: updatedBusiness.name,
      resetHour,
      resetMinute,
      timezone,
      message: 'Configuración de día comercial actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando configuración de día comercial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
