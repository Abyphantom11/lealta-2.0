/**
 * API para gestión de Promotores
 * GET    /api/promotores?businessId=xxx&search=juan&activo=true
 * POST   /api/promotores - Crear nuevo promotor
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

const prisma = new PrismaClient();

// Función para generar ID único
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// GET - Listar promotores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessIdOrSlug = searchParams.get('businessId');
    const search = searchParams.get('search') || '';
    const activoParam = searchParams.get('activo');

    if (!businessIdOrSlug) {
      return NextResponse.json(
        { error: 'businessId es requerido' },
        { status: 400 }
      );
    }

    // Resolver businessId (puede ser ID, subdomain o slug)
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessIdOrSlug },
          { subdomain: businessIdOrSlug },
          { slug: businessIdOrSlug },
        ],
      },
      select: { id: true },
    });

    if (!business) {
      console.error('❌ Business no encontrado:', businessIdOrSlug);
      return NextResponse.json(
        { error: 'Business no encontrado' },
        { status: 404 }
      );
    }

    const businessId = business.id;

    // Construir filtros
    const where: any = {
      businessId,
    };

    // Filtro por activo
    if (activoParam !== null) {
      where.activo = activoParam === 'true';
    }

    // Filtro por búsqueda (nombre)
    if (search) {
      where.nombre = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const promotores = await prisma.promotor.findMany({
      where,
      orderBy: {
        nombre: 'asc',
      },
      include: {
        _count: {
          select: {
            Reservation: true,
          },
        },
      },
    });

    // Transformar para incluir conteo
    const promotoresConStats = promotores.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      telefono: p.telefono,
      email: p.email,
      activo: p.activo,
      totalReservas: p._count.Reservation,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      promotores: promotoresConStats,
      total: promotoresConStats.length,
    });
  } catch (error) {
    console.error('Error al obtener promotores:', error);
    return NextResponse.json(
      { error: 'Error al obtener promotores' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo promotor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId: businessIdOrSlug, nombre, telefono, email } = body;

    console.log('📥 POST /api/promotores - Request body:', {
      businessIdOrSlug,
      nombre,
      telefono,
      email,
    });

    // Validaciones
    if (!businessIdOrSlug || !nombre) {
      console.error('❌ Validación fallida: businessId o nombre faltante');
      return NextResponse.json(
        { error: 'businessId y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el nombre no esté vacío
    if (nombre.trim().length === 0) {
      console.error('❌ Validación fallida: nombre vacío');
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      );
    }

    // Resolver businessId (puede ser ID, subdomain o slug)
    console.log('🔍 Resolviendo business...');
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessIdOrSlug },
          { subdomain: businessIdOrSlug },
          { slug: businessIdOrSlug },
        ],
      },
      select: { id: true, name: true },
    });

    if (!business) {
      console.error('❌ Business no encontrado:', businessIdOrSlug);
      return NextResponse.json(
        { error: 'Business no encontrado' },
        { status: 404 }
      );
    }

    const businessId = business.id;
    console.log('✅ Business encontrado:', business.name, 'ID:', businessId);

    // Verificar si ya existe un promotor con ese nombre
    console.log('🔍 Buscando promotor existente...');
    const existente = await prisma.promotor.findFirst({
      where: {
        businessId,
        nombre: nombre.trim(),
      },
    });

    if (existente) {
      console.warn('⚠️ Promotor ya existe:', existente.nombre);
      return NextResponse.json(
        { 
          error: 'Ya existe un promotor con ese nombre',
          promotor: existente,
        },
        { status: 409 } // Conflict
      );
    }

    // Crear promotor
    console.log('✅ Creando nuevo promotor...');
    const now = new Date();
    const nuevoPromotor = await prisma.promotor.create({
      data: {
        id: generateId(),
        businessId,
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        email: email?.trim() || null,
        activo: true,
        updatedAt: now,
      },
      include: {
        _count: {
          select: {
            Reservation: true,
          },
        },
      },
    });

    console.log('✅ Promotor creado exitosamente:', nuevoPromotor.id);

    return NextResponse.json({
      success: true,
      message: 'Promotor creado exitosamente',
      promotor: {
        id: nuevoPromotor.id,
        nombre: nuevoPromotor.nombre,
        telefono: nuevoPromotor.telefono,
        email: nuevoPromotor.email,
        activo: nuevoPromotor.activo,
        totalReservas: (nuevoPromotor as any)._count.Reservation,
        createdAt: nuevoPromotor.createdAt,
        updatedAt: nuevoPromotor.updatedAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error al crear promotor:', error);
    console.error('Error completo:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    // Error de unique constraint
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un promotor con ese nombre' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: `Error al crear promotor: ${error.message}` },
      { status: 500 }
    );
  }
}
