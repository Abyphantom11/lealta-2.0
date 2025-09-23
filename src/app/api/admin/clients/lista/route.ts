import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth, AuthConfig } from '../../../../../middleware/requireAuth';

const prisma = new PrismaClient();

// Configuración específica para lista de clientes
const CLIENTS_LIST_CONFIG: AuthConfig = {
  requiredPermission: 'clients.read', // Usar permiso específico que STAFF tiene
  allowedRoles: ['superadmin', 'admin', 'staff'] as const,
  requireBusinessOwnership: true,
  logAccess: true
};

// 🔒 GET - Lista completa de clientes (PROTEGIDO)
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      console.log(`📋 LISTA CLIENTES ADMIN: User ${session.userId} (${session.role}) accessing business ${session.businessId}`);
      
      // 🔒 Obtener SOLO clientes del business del usuario autenticado
      const clientes = await prisma.cliente.findMany({
        where: {
          businessId: session.businessId, // ✅ FILTRO CRÍTICO POR BUSINESS
        },
        orderBy: [
          { puntos: 'desc' }, // Ordenar por puntos descendente
          { nombre: 'asc' }   // Luego por nombre
        ],
        select: {
          id: true,
          cedula: true,
          nombre: true,
          telefono: true,
          correo: true,
          puntos: true,
          totalVisitas: true,
          totalGastado: true,
          registeredAt: true,
          lastLogin: true,
          businessId: true, // 🔍 Para debug
          tarjetaLealtad: {
            select: {
              nivel: true,
              activa: true,
              asignacionManual: true,
              fechaAsignacion: true,
            },
          },
        },
      });

      console.log(`✅ CLIENTES ENCONTRADOS ADMIN: ${clientes.length} clientes para business ${session.businessId}`);
      
      if (clientes.length > 0) {
        console.log(`📊 Primeros clientes:`, clientes.slice(0, 3).map(c => ({
          nombre: c.nombre,
          cedula: c.cedula,
          puntos: c.puntos,
          businessId: c.businessId
        })));
      }

      return NextResponse.json({
        success: true,
        clientes,
        businessId: session.businessId, // Para debug en frontend
        userRole: session.role,
        totalCount: clientes.length
      });
      
    } catch (error) {
      console.error('❌ Error en lista clientes admin:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error interno del servidor',
          clientes: []
        },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  }, CLIENTS_LIST_CONFIG);
}
