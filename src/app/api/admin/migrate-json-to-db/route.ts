import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthConfigs } from '../../../../middleware/requireAuth';

// 🔄 ENDPOINT DE MIGRACIÓN: Mover configuración de JSON a PostgreSQL
// Uso: POST /api/admin/migrate-json-to-db

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`🔄 JSON to DB migration by: ${session.role} (${session.userId})`);
      
      const body = await request.json();
      const { force = false } = body;
      
      // Esta será la configuración que queremos guardar en la BD
      const tarjetasConfig = [
        {
          nivel: 'Bronce',
          nombrePersonalizado: 'Tarjeta Bronce',
          textoCalidad: 'Cliente Inicial',
          colores: {
            gradiente: ['#CD7F32', '#8B4513'],
            texto: '#FFFFFF',
            nivel: '#CD7F32'
          },
          condiciones: {
            puntosMinimos: 0,
            gastosMinimos: 0,
            visitasMinimas: 0
          },
          beneficio: 'Acceso a beneficios Bronce',
          activo: true
        },
        {
          nivel: 'Plata',
          nombrePersonalizado: 'Tarjeta Plata',
          textoCalidad: 'Cliente Frecuente',
          colores: {
            gradiente: ['#C0C0C0', '#808080'],
            texto: '#FFFFFF',
            nivel: '#C0C0C0'
          },
          condiciones: {
            puntosMinimos: 100,
            gastosMinimos: 500,
            visitasMinimas: 5
          },
          beneficio: '9 dadadasd', // ✅ TU CAMBIO PERSONALIZADO
          activo: true
        },
        {
          nivel: 'Oro',
          nombrePersonalizado: 'Tarjeta Oro',
          textoCalidad: 'Cliente VIP',
          colores: {
            gradiente: ['#FFD700', '#FFA500'],
            texto: '#FFFFFF',
            nivel: '#FFD700'
          },
          condiciones: {
            puntosMinimos: 500,
            gastosMinimos: 1500,
            visitasMinimas: 10
          },
          beneficio: 'Acceso a beneficios Oro',
          activo: true
        },
        {
          nivel: 'Diamante',
          nombrePersonalizado: 'Tarjeta Diamante',
          textoCalidad: 'Cliente Elite',
          colores: {
            gradiente: ['#B9F2FF', '#00CED1'],
            texto: '#FFFFFF',
            nivel: '#B9F2FF'
          },
          condiciones: {
            puntosMinimos: 1500,
            gastosMinimos: 3000,
            visitasMinimas: 15
          },
          beneficio: 'Acceso a beneficios Diamante',
          activo: true
        },
        {
          nivel: 'Platino',
          nombrePersonalizado: 'Tarjeta Platino',
          textoCalidad: 'Cliente Exclusivo',
          colores: {
            gradiente: ['#E5E4E2', '#C0C0C0'],
            texto: '#FFFFFF',
            nivel: '#E5E4E2'
          },
          condiciones: {
            puntosMinimos: 3000,
            gastosMinimos: 5000,
            visitasMinimas: 30
          },
          beneficio: 'Acceso a beneficios Platino',
          activo: true
        }
      ];
      
      const businessId = session.businessId;
      
      // Verificar si ya existe configuración
      const existingConfig = await prisma.portalTarjetasConfig.findUnique({
        where: { businessId }
      });
      
      if (existingConfig && !force) {
        return NextResponse.json({
          success: false,
          message: 'Configuration already exists in database. Use force=true to overwrite.',
          existingConfig: {
            id: existingConfig.id,
            createdAt: existingConfig.createdAt,
            updatedAt: existingConfig.updatedAt
          }
        });
      }
      
      // Convertir tarjetas a formato de BD
      const levelsConfig = {};
      tarjetasConfig.forEach(tarjeta => {
        levelsConfig[tarjeta.nivel.toLowerCase()] = {
          nombrePersonalizado: tarjeta.nombrePersonalizado,
          textoCalidad: tarjeta.textoCalidad,
          minPoints: tarjeta.condiciones.puntosMinimos,
          minSpent: tarjeta.condiciones.gastosMinimos,
          minVisits: tarjeta.condiciones.visitasMinimas,
          benefits: [tarjeta.beneficio],
          colors: tarjeta.colores.gradiente,
          active: tarjeta.activo
        };
      });
      
      // Guardar o actualizar en la base de datos
      const savedConfig = await prisma.portalTarjetasConfig.upsert({
        where: { businessId },
        create: {
          businessId,
          levelsConfig,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        update: {
          levelsConfig,
          updatedAt: new Date()
        }
      });
      
      // También crear/actualizar configuración general del portal
      const generalConfig = {
        nombreEmpresa: 'Mi Negocio',
        version: '2.0.0',
        lastUpdated: new Date().toISOString(),
        source: 'database-migration'
      };
      
      const portalConfig = await prisma.portalConfig.upsert({
        where: { businessId },
        create: {
          businessId,
          config: generalConfig,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        update: {
          config: generalConfig,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Configuration migrated to database for business ${businessId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Configuration successfully migrated to database',
        data: {
          tarjetasConfig: savedConfig,
          portalConfig: portalConfig,
          tarjetasCount: tarjetasConfig.length,
          businessId,
          migratedBy: session.userId
        }
      });
      
    } catch (error) {
      console.error('❌ Error migrating configuration:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }
  }, AuthConfigs.ADMIN_ONLY);
}
