import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Hardcoded para business arepa - cmfl1ge7x0000eyqwlv83osys
    const arepaBusinessId = "cmfl1ge7x0000eyqwlv83osys";
    
    console.log(`🔧 MIGRACIÓN AUTOMÁTICA: Asignando clientes sin businessId al business arepa`);

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
        businessId: arepaBusinessId
      }
    });

    console.log(`✅ Actualizados ${updateResult.count} clientes con businessId: ${arepaBusinessId}`);

    // 3. Actualizar tarjetas de lealtad sin businessId
    const updateTarjetasResult = await prisma.tarjetaLealtad.updateMany({
      where: {
        businessId: null
      },
      data: {
        businessId: arepaBusinessId
      }
    });

    console.log(`✅ Actualizadas ${updateTarjetasResult.count} tarjetas con businessId: ${arepaBusinessId}`);

    // 4. Verificar resultados
    const clientesVerificacion = await prisma.cliente.findMany({
      where: {
        businessId: arepaBusinessId
      },
      select: {
        id: true,
        cedula: true,
        nombre: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: `Migración completada exitosamente para business arepa`,
      migrated: {
        clientes: updateResult.count,
        tarjetas: updateTarjetasResult.count
      },
      verification: {
        totalClientesEnBusiness: clientesVerificacion.length
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
