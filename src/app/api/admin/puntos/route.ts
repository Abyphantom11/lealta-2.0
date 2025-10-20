import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

interface ConfiguracionPuntos {
  puntosPorDolar: number;
  bonusPorRegistro: number;
  limites: {
    maxPuntosPorDolar: number;
    maxBonusRegistro: number;
  };
}

/**
 * 🔒 GET - Obtener configuración actual de puntos (PROTEGIDO - WRITE)
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`📊 GET Points config for business: ${session.businessId}`);
      
      // Buscar configuración en la base de datos
      let puntosConfig = await prisma.puntosConfig.findUnique({
        where: { businessId: session.businessId }
      });
      
      // Si no existe, crear con valores por defecto
      if (!puntosConfig) {
        console.log(`⚙️ Creating default points config for business: ${session.businessId}`);
        puntosConfig = await prisma.puntosConfig.create({
          data: {
            id: nanoid(),
            businessId: session.businessId,
            puntosPorDolar: 2,
            bonusPorRegistro: 100,
            maxPuntosPorDolar: 10,
            maxBonusRegistro: 1000,
            updatedAt: new Date(),
          }
        });
      }
      
      const configuracionPuntos: ConfiguracionPuntos = {
        puntosPorDolar: puntosConfig.puntosPorDolar,
        bonusPorRegistro: puntosConfig.bonusPorRegistro,
        limites: {
          maxPuntosPorDolar: puntosConfig.maxPuntosPorDolar,
          maxBonusRegistro: puntosConfig.maxBonusRegistro
        }
      };

      return NextResponse.json({
        success: true,
        data: configuracionPuntos
      });

    } catch (error) {
      console.error('❌ Error leyendo configuración de puntos:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }, AuthConfigs.WRITE);
}

/**
 * 🔒 POST - Actualizar configuración de puntos (PROTEGIDO - WRITE)
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🔧 Points config UPDATE by: ${session.role} (${session.userId}) for business: ${session.businessId}`);
      
      const body: Partial<ConfiguracionPuntos> = await request.json();

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

      // Actualizar o crear configuración en la base de datos
      const puntosConfig = await prisma.puntosConfig.upsert({
        where: { businessId: session.businessId },
        update: {
          puntosPorDolar: body.puntosPorDolar,
          bonusPorRegistro: body.bonusPorRegistro,
          maxPuntosPorDolar: 10,
          maxBonusRegistro: 1000
        },
        create: {
          id: nanoid(),
          businessId: session.businessId,
          puntosPorDolar: body.puntosPorDolar || 2,
          bonusPorRegistro: body.bonusPorRegistro || 100,
          maxPuntosPorDolar: 10,
          maxBonusRegistro: 1000,
          updatedAt: new Date(),
        }
      });

      const nuevaConfiguracion: ConfiguracionPuntos = {
        puntosPorDolar: puntosConfig.puntosPorDolar,
        bonusPorRegistro: puntosConfig.bonusPorRegistro,
        limites: {
          maxPuntosPorDolar: puntosConfig.maxPuntosPorDolar,
          maxBonusRegistro: puntosConfig.maxBonusRegistro
        }
      };

      return NextResponse.json({
        success: true,
        message: 'Configuración de puntos actualizada exitosamente',
        data: nuevaConfiguracion,
        updatedBy: session.userId,
        businessId: session.businessId
      });

    } catch (error) {
      console.error('❌ Error actualizando configuración de puntos:', error);
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }, AuthConfigs.WRITE);
}
