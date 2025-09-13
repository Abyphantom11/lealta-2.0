import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { clienteIds } = await request.json();

    if (!Array.isArray(clienteIds) || clienteIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Se requiere una lista de IDs de clientes' },
        { status: 400 }
      );
    }

    let asignadas = 0;
    const errores: string[] = [];

    // Procesar cada cliente
    for (const clienteId of clienteIds) {
      try {
        // Verificar que el cliente existe
        const cliente = await prisma.cliente.findUnique({
          where: { id: clienteId },
          include: { tarjetaLealtad: true }
        });

        if (!cliente) {
          errores.push(`Cliente con ID ${clienteId} no encontrado`);
          continue;
        }

        // Verificar que no tenga tarjeta ya asignada
        if (cliente.tarjetaLealtad) {
          errores.push(`Cliente ${cliente.nombre} ya tiene tarjeta asignada`);
          continue;
        }

        // Asignar tarjeta Bronce
        await prisma.tarjetaLealtad.create({
          data: {
            clienteId: clienteId,
            nivel: 'Bronce',
            activa: true,
            asignacionManual: true, // Es una asignación manual masiva
            fechaAsignacion: new Date(),
            businessId: null, // Por ahora sin business relationship
          },
        });

        asignadas++;
        console.log(`✅ Tarjeta Bronce asignada a ${cliente.nombre} (${cliente.cedula})`);

      } catch (clienteError) {
        console.error(`Error procesando cliente ${clienteId}:`, clienteError);
        errores.push(`Error procesando cliente ${clienteId}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Proceso completado. ${asignadas} tarjetas asignadas.`,
      asignadas,
      errores: errores.length > 0 ? errores : undefined,
    });

  } catch (error) {
    console.error('Error en asignación masiva de tarjetas:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
