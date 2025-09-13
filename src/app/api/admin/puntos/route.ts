import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const PORTAL_CONFIG_PATH = path.join(process.cwd(), 'portal-config.json');

interface ConfiguracionPuntos {
  puntosPorDolar: number;
  bonusPorRegistro: number;
  limites: {
    maxPuntosPorDolar: number;
    maxBonusRegistro: number;
  };
}

/**
 * GET - Obtener configuración actual de puntos
 */
export async function GET() {
  try {
    const configContent = await fs.readFile(PORTAL_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);
    
    const configuracionPuntos = config.configuracionPuntos || {
      puntosPorDolar: 2,
      bonusPorRegistro: 100,
      limites: {
        maxPuntosPorDolar: 10,
        maxBonusRegistro: 1000
      }
    };

    return NextResponse.json({
      success: true,
      data: configuracionPuntos
    });

  } catch (error) {
    console.error('Error leyendo configuración de puntos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Actualizar configuración de puntos
 */
export async function POST(request: NextRequest) {
  try {
    const body: Partial<ConfiguracionPuntos> = await request.json();

    // Leer configuración actual
    const configContent = await fs.readFile(PORTAL_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(configContent);

    // Validar límites
    if (body.puntosPorDolar && (body.puntosPorDolar < 1 || body.puntosPorDolar > 10)) {
      return NextResponse.json(
        { error: 'Los puntos por dólar deben estar entre 1 y 10' },
        { status: 400 }
      );
    }

    if (body.bonusPorRegistro && (body.bonusPorRegistro < 1 || body.bonusPorRegistro > 1000)) {
      return NextResponse.json(
        { error: 'El bonus por registro debe estar entre 1 y 1000' },
        { status: 400 }
      );
    }

    // Actualizar configuración
    const nuevaConfiguracion = {
      ...config.configuracionPuntos,
      ...body,
      limites: {
        maxPuntosPorDolar: 10,
        maxBonusRegistro: 1000
      }
    };

    config.configuracionPuntos = nuevaConfiguracion;

    // Guardar archivo
    await fs.writeFile(PORTAL_CONFIG_PATH, JSON.stringify(config, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Configuración de puntos actualizada exitosamente',
      data: nuevaConfiguracion
    });

  } catch (error) {
    console.error('Error actualizando configuración de puntos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
