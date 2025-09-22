import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 🧪 ENDPOINT DE DEBUG PARA VISITAS - VERSION SIMPLIFICADA

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 DEBUG POST /api/cliente/debug-visitas');
    
    const body = await request.json();
    console.log('🧪 Body recibido:', body);
    
    const { sessionId, path } = body;

    // Test 1: Verificar que tenemos los datos mínimos
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
    }

    // Test 2: Usar businessId hardcodeado conocido
    const testBusinessId = 'cmfr2y0ia0000eyvw7ef3k20u';
    
    // Test 3: Verificar que el business existe
    const business = await prisma.business.findUnique({
      where: { id: testBusinessId }
    });
    
    if (!business) {
      return NextResponse.json({ 
        error: 'Business no encontrado', 
        businessId: testBusinessId 
      }, { status: 404 });
    }

    console.log('✅ Business encontrado:', business.name);

    // Test 4: Crear visita mínima
    const visitaData = {
      sessionId: sessionId,
      businessId: testBusinessId,
      path: path || '/cliente',
      isRegistered: false
    };

    console.log('🧪 Creando visita con datos:', visitaData);

    const nuevaVisita = await prisma.visita.create({
      data: visitaData
    });

    console.log('✅ Visita creada exitosamente:', nuevaVisita.id);

    return NextResponse.json({
      success: true,
      message: 'Visita debug registrada exitosamente',
      visitaId: nuevaVisita.id,
      businessName: business.name,
      data: visitaData
    });

  } catch (error: any) {
    console.error('❌ Error en debug-visitas:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return NextResponse.json({
      error: 'Error interno',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
