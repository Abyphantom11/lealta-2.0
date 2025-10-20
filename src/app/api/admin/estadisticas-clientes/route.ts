import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

interface NivelConfig {
  nombre: string;
  color: string;
  requisitoVisitas?: number;
  requisitoPuntos?: number;
}

interface EstadisticasDistribucion {
  [key: string]: number;
}

// Obtener estadísticas de la distribución de niveles
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
  try {
    console.log(`📊 Estadisticas-clientes GET by: ${session.role} (${session.userId}) - Business: ${session.businessId}`);

    const { businessId } = session;

    // Obtener clientes SOLO del business del usuario
    const clientes = await prisma.cliente.findMany({
      where: {
        businessId: businessId, // ✅ FILTRO POR BUSINESS
      },
      include: {
        TarjetaLealtad: true,
        Consumo: {
          take: 1,
          orderBy: { registeredAt: 'desc' },
        },
      },
    });

    // 🔒 BUSINESS ISOLATION: Obtener configuración del business específico
    const configPath = path.join(process.cwd(), 'config', 'portal', `portal-config-${session.businessId}.json`);
    
    // Verificar si existe el archivo específico del business
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: `No existe configuración para el business ${session.businessId}` },
        { status: 400 }
      );
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (!config.tarjetas?.[0]) {
      return NextResponse.json(
        { error: 'No hay configuración de tarjetas' },
        { status: 400 }
      );
    }

    const tarjetaConfig = config.tarjetas[0];

    // Validar que existe configuración de niveles
    if (!tarjetaConfig.niveles || !Array.isArray(tarjetaConfig.niveles)) {
      return NextResponse.json(
        { error: 'No hay configuración de niveles en las tarjetas' },
        { status: 400 }
      );
    }

    // Calcular estadísticas
    const estadisticas = {
      totalClientes: clientes.length,
      clientesActivos: clientes.filter(c => c.consumos.length > 0).length,
      distribucionNiveles: {} as EstadisticasDistribucion,
      clientesSinTarjeta: 0,
      promedios: {
        puntos: 0,
        visitas: 0,
        gastoTotal: 0,
      },
    };

    // Inicializar distribución de niveles
    tarjetaConfig.niveles.forEach((nivel: NivelConfig) => {
      estadisticas.distribucionNiveles[nivel.nombre] = 0;
    });

    let totalPuntos = 0;
    let totalVisitas = 0;
    let totalGastos = 0;

    // Procesar cada cliente
    clientes.forEach(cliente => {
      // Sumar para promedios
      totalPuntos += cliente.puntos || 0;
      totalVisitas += cliente.totalVisitas || 0;
      totalGastos += cliente.totalGastado || 0;

      // Contar distribución de niveles
      if (cliente.tarjetaLealtad?.nivel) {
        if (
          estadisticas.distribucionNiveles.hasOwnProperty(
            cliente.tarjetaLealtad.nivel
          )
        ) {
          estadisticas.distribucionNiveles[cliente.tarjetaLealtad.nivel]++;
        }
      } else {
        estadisticas.clientesSinTarjeta++;
      }
    });

    // Calcular promedios
    if (clientes.length > 0) {
      estadisticas.promedios.puntos = Math.round(totalPuntos / clientes.length);
      estadisticas.promedios.visitas = Math.round(
        totalVisitas / clientes.length
      );
      estadisticas.promedios.gastoTotal = Math.round(
        totalGastos / clientes.length
      );
    }

    // Agregar detalles de configuración actual
    const configuracionActual = {
      tarjeta: tarjetaConfig.nombre,
      niveles: tarjetaConfig.niveles.map((nivel: NivelConfig) => ({
        nombre: nivel.nombre,
        puntosRequeridos: (nivel as any).puntosRequeridos,
        visitasRequeridas: (nivel as any).visitasRequeridas,
      })),
    };

    return NextResponse.json({
      estadisticas,
      configuracionActual,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
  }, AuthConfigs.READ_ONLY);
}
