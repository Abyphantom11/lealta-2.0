import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// 🔍 GET - Búsqueda de clientes para staff (NO necesita auth estricta)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const businessId = request.headers.get('x-business-id');

    console.log('🔍 Staff client search:', { query, businessId });

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Si no hay businessId, intentar buscar en todos los businesses (modo fallback)
    const whereClause: any = {
      OR: [
        { nombre: { contains: query, mode: 'insensitive' } },
        { correo: { contains: query, mode: 'insensitive' } },
        { telefono: { contains: query } },
        { cedula: { contains: query } },
      ],
    };

    // Si tenemos businessId, filtrar por él
    if (businessId && businessId !== 'null' && businessId !== 'undefined') {
      whereClause.businessId = businessId;
      console.log('✅ Filtering by businessId:', businessId);
    } else {
      console.log('⚠️ No businessId provided, searching across all businesses');
    }

    // Buscar clientes con estadísticas actualizadas
    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      select: {
        id: true,
        businessId: true,
        nombre: true,
        cedula: true,
        correo: true,
        telefono: true,
        puntos: true,
        totalGastado: true,
        totalVisitas: true,
        // Incluir información de tarjeta si existe
        tarjetaLealtad: {
          select: {
            nivel: true,
            activa: true,
            asignacionManual: true,
            fechaAsignacion: true,
          },
        },
        // Incluir business info para debugging
        business: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      take: 15, // Limitar resultados para mejor rendimiento
      orderBy: [
        { nombre: 'asc' },
      ],
    });

    console.log(`✅ Found ${clientes.length} clients matching "${query}"`);

    // Procesar datos para compatibilidad con el frontend
    const clientesProcessados = clientes.map(cliente => ({
      id: cliente.id,
      businessId: cliente.businessId,
      businessName: cliente.business?.name || 'Unknown',
      nombre: cliente.nombre,
      cedula: cliente.cedula,
      email: cliente.correo, // Mapear correo a email para compatibilidad
      telefono: cliente.telefono,
      puntos: cliente.puntos,
      visitas: cliente.totalVisitas,
      totalGastado: cliente.totalGastado,
      tarjetaFidelizacion: cliente.tarjetaLealtad ? {
        nivel: cliente.tarjetaLealtad.nivel,
        activa: cliente.tarjetaLealtad.activa,
        asignacionManual: cliente.tarjetaLealtad.asignacionManual,
        fechaAsignacion: cliente.tarjetaLealtad.fechaAsignacion,
      } : null,
    }));

    return NextResponse.json(clientesProcessados);

  } catch (error) {
    console.error('❌ Error in staff client search:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
