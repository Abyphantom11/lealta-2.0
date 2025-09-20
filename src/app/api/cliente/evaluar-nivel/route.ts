import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { evaluateAndUpdateLevel } from '../../../../utils/evaluate-level';
import { validateBusinessAccess } from '../../../../utils/business-validation';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { cedula, businessId: bodyBusinessId } = body;

    // Obtener business ID desde múltiples fuentes
    let businessId: string;
    
    try {
      businessId = validateBusinessAccess(request);
    } catch {
      const headerBusinessId = request.headers.get('x-business-id');
      if (headerBusinessId) {
        businessId = headerBusinessId;
      } else if (bodyBusinessId) {
        businessId = bodyBusinessId;
      } else {
        return NextResponse.json(
          { error: 'Business ID required for level evaluation' },
          { status: 400 }
        );
      }
    }

    if (!cedula) {
      return NextResponse.json(
        { error: 'Cédula es requerida' },
        { status: 400 }
      );
    }

    // console.log(`🤖 Cliente Evaluación: Evaluando nivel para cliente ${cedula} en business ${businessId}`);

    // Buscar el cliente
    const cliente = await prisma.cliente.findFirst({
      where: {
        cedula: cedula.toString(),
        businessId
      },
      include: {
        tarjetaLealtad: true,
        business: true
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Evaluar y actualizar el nivel del cliente
    const evaluationResult = await evaluateAndUpdateLevel(cliente.id, businessId);

    // console.log(`✅ Cliente Evaluación: Resultado para ${cedula}:`, evaluationResult);

    return NextResponse.json(evaluationResult);

  } catch (error) {
    console.error('❌ Error evaluando nivel del cliente:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
