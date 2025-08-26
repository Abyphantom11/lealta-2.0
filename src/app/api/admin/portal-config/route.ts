import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Configurar como ruta dinámica para permitir el uso de request.url
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// GET - Obtener configuración del portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId') || 'default';

    let portalConfig = await prisma.portalConfig.findUnique({
      where: { businessId }
    });

    // Si no existe configuración, crear una por defecto usando nullish coalescing
    portalConfig ??= await prisma.portalConfig.create({
      data: {
        businessId,
        banners: [
          {
            id: '1',
            titulo: 'Bienvenido a nuestro restaurante',
            descripcion: 'Disfruta de la mejor experiencia gastronómica',
            imagen: '/default-banner.jpg',
            activo: true,
            fechaInicio: new Date().toISOString(),
            fechaFin: null
          }
        ],
        promociones: [
          {
            id: '1',
            titulo: '2x1 en Cócteles',
            descripcion: 'Válido hasta el domingo',
            descuento: 50,
            tipo: 'porcentaje',
            activo: true,
            fechaInicio: new Date().toISOString(),
            fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        eventos: [
          {
            id: '1',
            titulo: 'Música en vivo',
            descripcion: 'Todos los viernes a partir de las 8pm',
            fecha: new Date().toISOString(),
            activo: true
          }
        ],
        recompensas: [
          {
            id: '1',
            nombre: 'Postre gratis',
            descripcion: 'Elige cualquier postre de nuestra carta',
            puntosRequeridos: 150,
            imagen: '/reward-dessert.jpg',
            activo: true,
            stock: 50
          },
          {
            id: '2',
            nombre: 'Descuento 20%',
            descripcion: 'Descuento en tu próxima visita',
            puntosRequeridos: 100,
            imagen: '/reward-discount.jpg',
            activo: true,
            stock: -1 // Ilimitado
          }
        ],
        favoritoDelDia: {
          id: '1',
          nombre: 'Tacos de Camarón Especiales',
          descripcion: 'Tacos frescos con camarones del golfo y salsa especial de la casa',
          precio: 15.99,
          imagenUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
          activo: true,
          fechaCreacion: new Date().toISOString()
        },
        updatedBy: 'system'
      } as any
    });

    return NextResponse.json({
      success: true,
      config: portalConfig
    });

  } catch (error) {
    console.error('Error obteniendo configuración del portal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración del portal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, banners, promociones, eventos, recompensas, favoritoDelDia, colores, logo, updatedBy } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'BusinessId es requerido' },
        { status: 400 }
      );
    }

    const portalConfig = await prisma.portalConfig.upsert({
      where: { businessId },
      update: {
        banners: banners || [],
        promociones: promociones || [],
        eventos: eventos || [],
        recompensas: recompensas || [],
        favoritoDelDia: favoritoDelDia || null,
        colores: colores || null,
        logo: logo || null,
        updatedBy: updatedBy || 'unknown'
      } as any,
      create: {
        businessId,
        banners: banners || [],
        promociones: promociones || [],
        eventos: eventos || [],
        recompensas: recompensas || [],
        favoritoDelDia: favoritoDelDia || null,
        colores: colores || null,
        logo: logo || null,
        updatedBy: updatedBy || 'unknown'
      } as any
    });

    return NextResponse.json({
      success: true,
      config: portalConfig
    });

  } catch (error) {
    console.error('Error actualizando configuración del portal:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
