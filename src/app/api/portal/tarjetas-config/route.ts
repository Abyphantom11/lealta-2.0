import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getBusinessIdFromRequest } from '@/lib/business-utils';

const prisma = new PrismaClient();

// GET - Obtener configuración de tarjetas del portal
export async function GET(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    let tarjetasConfig = await prisma.portalTarjetasConfig.findUnique({
      where: {
        businessId
      }
    });

    // Si no existe configuración, crear una por defecto
    if (!tarjetasConfig) {
      tarjetasConfig = await prisma.portalTarjetasConfig.create({
        data: {
          businessId,
          showLevels: true,
          showProgress: true,
          showBenefits: true,
          showPointsInfo: true,
          levelsConfig: {
            bronce: { minPoints: 0, benefits: ['Descuentos especiales'] },
            plata: { minPoints: 1000, benefits: ['Descuentos VIP', 'Cumpleaños especial'] },
            oro: { minPoints: 5000, benefits: ['Descuentos premium', 'Eventos exclusivos'] },
            diamante: { minPoints: 15000, benefits: ['Descuentos máximos', 'Acceso VIP total'] }
          },
          pointsConfig: {
            earnRate: 1, // 1 punto por cada peso gastado
            welcomeBonus: 100,
            birthdayBonus: 500
          },
          visualConfig: {
            primaryColor: '#8B5CF6',
            secondaryColor: '#A78BFA',
            accentColor: '#F59E0B'
          }
        }
      });
    }

    return NextResponse.json({ tarjetasConfig });
  } catch (error) {
    console.error('Error obteniendo configuración de tarjetas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de tarjetas (solo admin)
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
    const { 
      showLevels, 
      showProgress, 
      showBenefits, 
      showPointsInfo, 
      levelsConfig, 
      pointsConfig, 
      visualConfig 
    } = body;

    const tarjetasConfig = await prisma.portalTarjetasConfig.upsert({
      where: {
        businessId
      },
      update: {
        showLevels,
        showProgress,
        showBenefits,
        showPointsInfo,
        levelsConfig,
        pointsConfig,
        visualConfig
      },
      create: {
        businessId,
        showLevels: showLevels ?? true,
        showProgress: showProgress ?? true,
        showBenefits: showBenefits ?? true,
        showPointsInfo: showPointsInfo ?? true,
        levelsConfig: levelsConfig ?? {
          bronce: { minPoints: 0, benefits: ['Descuentos especiales'] },
          plata: { minPoints: 1000, benefits: ['Descuentos VIP', 'Cumpleaños especial'] },
          oro: { minPoints: 5000, benefits: ['Descuentos premium', 'Eventos exclusivos'] },
          diamante: { minPoints: 15000, benefits: ['Descuentos máximos', 'Acceso VIP total'] }
        },
        pointsConfig: pointsConfig ?? {
          earnRate: 1,
          welcomeBonus: 100,
          birthdayBonus: 500
        },
        visualConfig: visualConfig ?? {
          primaryColor: '#8B5CF6',
          secondaryColor: '#A78BFA',
          accentColor: '#F59E0B'
        }
      }
    });

    return NextResponse.json({ tarjetasConfig });
  } catch (error) {
    console.error('Error actualizando configuración de tarjetas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Resetear configuración a valores por defecto (solo admin)
export async function POST(request: NextRequest) {
  try {
    const businessId = getBusinessIdFromRequest(request);
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID requerido' },
        { status: 400 }
      );
    }

    const tarjetasConfig = await prisma.portalTarjetasConfig.upsert({
      where: {
        businessId
      },
      update: {
        showLevels: true,
        showProgress: true,
        showBenefits: true,
        showPointsInfo: true,
        levelsConfig: {
          bronce: { minPoints: 0, benefits: ['Descuentos especiales'] },
          plata: { minPoints: 1000, benefits: ['Descuentos VIP', 'Cumpleaños especial'] },
          oro: { minPoints: 5000, benefits: ['Descuentos premium', 'Eventos exclusivos'] },
          diamante: { minPoints: 15000, benefits: ['Descuentos máximos', 'Acceso VIP total'] }
        },
        pointsConfig: {
          earnRate: 1,
          welcomeBonus: 100,
          birthdayBonus: 500
        },
        visualConfig: {
          primaryColor: '#8B5CF6',
          secondaryColor: '#A78BFA',
          accentColor: '#F59E0B'
        }
      },
      create: {
        businessId,
        showLevels: true,
        showProgress: true,
        showBenefits: true,
        showPointsInfo: true,
        levelsConfig: {
          bronce: { minPoints: 0, benefits: ['Descuentos especiales'] },
          plata: { minPoints: 1000, benefits: ['Descuentos VIP', 'Cumpleaños especial'] },
          oro: { minPoints: 5000, benefits: ['Descuentos premium', 'Eventos exclusivos'] },
          diamante: { minPoints: 15000, benefits: ['Descuentos máximos', 'Acceso VIP total'] }
        },
        pointsConfig: {
          earnRate: 1,
          welcomeBonus: 100,
          birthdayBonus: 500
        },
        visualConfig: {
          primaryColor: '#8B5CF6',
          secondaryColor: '#A78BFA',
          accentColor: '#F59E0B'
        }
      }
    });

    return NextResponse.json({ tarjetasConfig }, { status: 201 });
  } catch (error) {
    console.error('Error reseteando configuración de tarjetas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
