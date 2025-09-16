import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const cedula = searchParams.get('cedula');
    
    console.log('🔍 DEBUG: Buscando cliente', { businessId, cedula });
    
    // Buscar todos los clientes si no hay filtros específicos
    const whereClause: any = {};
    
    if (businessId) {
      whereClause.businessId = businessId;
    }
    
    if (cedula) {
      whereClause.cedula = { contains: cedula };
    }
    
    const clientes = await prisma.cliente.findMany({
      where: whereClause,
      select: {
        id: true,
        businessId: true,
        cedula: true,
        nombre: true,
        correo: true,
        telefono: true,
        puntos: true,
        totalGastado: true,
        business: {
          select: {
            id: true,
            name: true,
            subdomain: true,
          }
        }
      },
      take: 50
    });
    
    // También buscar todos los businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        isActive: true,
        _count: {
          select: {
            clientes: true
          }
        }
      }
    });

    // Buscar business específico de arepa
    const arepaBusiness = businesses.find(b => b.subdomain === 'arepa');
    
    return NextResponse.json({
      success: true,
      clientes,
      businesses,
      arepaBusiness,
      total: clientes.length,
      debug: {
        searchParams: { businessId, cedula },
        whereClause,
        clientesSinBusiness: clientes.filter(c => !c.businessId).length
      }
    });
    
  } catch (error) {
    console.error('❌ Error en debug clientes:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
