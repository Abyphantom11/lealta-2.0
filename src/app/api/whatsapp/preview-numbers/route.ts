/**
 * 📱 API de Vista Previa de Números para WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/middleware/requireAuth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth(request, {
      allowedRoles: ['superadmin']
    });
    
    if (!authResult.success) {
      return authResult.response;
    }

    const body = await request.json();
    const { filtros } = body;

    console.log('🔍 Vista previa de números solicitada:', {
      session: authResult.session,
      filtros
    });

    // Por ahora, usar función simplificada sin depender de obtenerClientesParaCampana
    // que requiere Twilio
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = {};
    
    if (authResult.session.businessId) {
      where.businessId = authResult.session.businessId;
    }

    // Aplicar filtros según el tipo
    if (filtros.tipoFiltro === 'puntos' || filtros.tipoFiltro === 'combinado') {
      if (filtros.puntosMinimos) {
        where.puntos = {
          gte: filtros.puntosMinimos
        };
      }
    }

    const clientes = await prisma.cliente.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        telefono: true,
        puntos: true,
        businessId: true
      }
    });

    // Filtrar y formatear números
    const clientesValidos = clientes
      .filter((cliente: any) => cliente.telefono && cliente.telefono.trim() !== '')
      .map((cliente: any) => {
        const phone = cliente.telefono;
        const cleaned = phone.replaceAll(/\D/g, '');
        
        let formatted = null;
        
        // Formato 09XXXXXXXX (10 dígitos)
        if (cleaned.startsWith('09') && cleaned.length === 10) {
          formatted = `+593${cleaned.substring(1)}`;
        }
        // Formato 5939XXXXXXXX (12 dígitos)
        else if (cleaned.startsWith('5939') && cleaned.length === 12) {
          formatted = `+${cleaned}`;
        }
        // Formato 593XXXXXXXXX donde X empieza con 9 (12 dígitos)
        else if (cleaned.startsWith('593') && cleaned.length === 12) {
          const ecuadorianNumber = cleaned.substring(3);
          if (ecuadorianNumber.startsWith('9') && ecuadorianNumber.length === 9) {
            formatted = `+${cleaned}`;
          }
        }
        // Formato 9XXXXXXXX (9 dígitos) - agregar 593
        else if (cleaned.startsWith('9') && cleaned.length === 9) {
          formatted = `+593${cleaned}`;
        }
        // Formato +5939XXXXXXXX (ya formateado)
        else if (phone.startsWith('+5939') && cleaned.length === 12) {
          formatted = phone;
        }

        if (!formatted) return null;

        return {
          ...cliente,
          telefono: formatted
        };
      })
      .filter((cliente: any) => cliente !== null);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      clientes: clientesValidos,
      total: clientesValidos.length,
      filtros_aplicados: {
        tipo: filtros.tipoFiltro || 'todos',
        puntos_minimos: filtros.puntosMinimos,
        ultima_visita_dias: filtros.ultimaVisitaDias,
        solo_numeros_09: true
      }
    });

  } catch (error: any) {
    console.error('❌ Error en vista previa de números:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
