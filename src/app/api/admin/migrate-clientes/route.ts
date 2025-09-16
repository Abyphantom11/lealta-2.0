import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { businessId, targetBusinessSubdomain } = await request.json();
    
    if (!businessId || !targetBusinessSubdomain) {
      return NextResponse.json(
        { error: 'businessId y targetBusinessSubdomain son requeridos' },
        { status: 400 }
      );
    }

    console.log(`🔧 MIGRACIÓN: Asignando clientes sin businessId al business: ${businessId} (${targetBusinessSubdomain})`);

    // 1. Encontrar clientes sin businessId
    const clientesSinBusiness = await prisma.cliente.findMany({
      where: {
        businessId: null
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        correo: true,
      }
    });

    console.log(`📊 Encontrados ${clientesSinBusiness.length} clientes sin businessId`);

    if (clientesSinBusiness.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay clientes sin businessId para migrar',
        migrated: 0
      });
    }

    // 2. Actualizar clientes para asignarles el businessId
    const updateResult = await prisma.cliente.updateMany({
      where: {
        businessId: null
      },
      data: {
        businessId: businessId
      }
    });

    console.log(`✅ Actualizados ${updateResult.count} clientes con businessId: ${businessId}`);

    // 3. Actualizar tarjetas de lealtad sin businessId
    const tarjetasSinBusiness = await prisma.tarjetaLealtad.findMany({
      where: {
        businessId: null
      },
      select: {
        id: true,
        clienteId: true,
        nivel: true,
      }
    });

    console.log(`📊 Encontradas ${tarjetasSinBusiness.length} tarjetas sin businessId`);

    let tarjetasActualizadas = 0;
    if (tarjetasSinBusiness.length > 0) {
      const updateTarjetasResult = await prisma.tarjetaLealtad.updateMany({
        where: {
          businessId: null
        },
        data: {
          businessId: businessId
        }
      });
      tarjetasActualizadas = updateTarjetasResult.count;
      console.log(`✅ Actualizadas ${tarjetasActualizadas} tarjetas con businessId: ${businessId}`);
    }

    // 4. Verificar resultados
    const clientesVerificacion = await prisma.cliente.findMany({
      where: {
        businessId: businessId
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
        business: {
          select: {
            name: true,
            subdomain: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Migración completada exitosamente para business: ${targetBusinessSubdomain}`,
      migrated: {
        clientes: updateResult.count,
        tarjetas: tarjetasActualizadas
      },
      verification: {
        totalClientesEnBusiness: clientesVerificacion.length,
        businessInfo: clientesVerificacion[0]?.business || { name: 'N/A', subdomain: targetBusinessSubdomain }
      },
      clientesMigrados: clientesSinBusiness.map(c => ({
        cedula: c.cedula,
        nombre: c.nombre
      }))
    });

  } catch (error) {
    console.error('❌ Error en migración de clientes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: String(error) 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
