import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ThemeStyle = 'moderno' | 'elegante' | 'sencillo';

interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  nameColor?: string;
}

const VALID_THEMES: ThemeStyle[] = ['moderno', 'elegante', 'sencillo'];

// POST /api/business/[businessId]/client-theme - Guardar tema del cliente
export async function POST(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  try {
    const { theme, config } = await request.json();
    const { businessId } = params;

    if (theme && !VALID_THEMES.includes(theme)) {
      return NextResponse.json(
        { error: 'Tema inválido. Debe ser: moderno, elegante o sencillo' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (theme) updateData.clientTheme = theme;
    if (config) updateData.clientThemeConfig = config;

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      theme: updatedBusiness.clientTheme,
      config: updatedBusiness.clientThemeConfig as ThemeConfig || {},
    });
  } catch (error) {
    console.error('Error guardando tema:', error);
    return NextResponse.json(
      { error: 'Error al guardar el tema' },
      { status: 500 }
    );
  }
}

// GET /api/business/[businessId]/client-theme - Obtener tema actual
export async function GET(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { 
        clientTheme: true,
        clientThemeConfig: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      theme: business.clientTheme || 'moderno',
      config: business.clientThemeConfig as ThemeConfig || {},
    });
  } catch (error) {
    console.error('Error obteniendo tema:', error);
    return NextResponse.json(
      { error: 'Error al obtener el tema' },
      { status: 500 }
    );
  }
}
