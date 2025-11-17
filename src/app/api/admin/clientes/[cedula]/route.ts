import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/unified-middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/clientes/[cedula]
 * Obtener datos de un cliente específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { cedula: string } }
) {
  try {
    // Intentar primero con NextAuth
    let session = await getServerSession(authOptions);
    
    // Si NextAuth no funciona, intentar con middleware unificado como fallback
    if (!session?.user?.id) {
      const authResult = await requireAuth(request, { 
        role: 'ADMIN',
        allowSuperAdmin: true 
      });
      
      if ('error' in authResult) {
        return authResult.error;
      }
      
      // Convertir usuario del middleware unificado a formato de sesión
      const unifiedUser = authResult.user;
      session = {
        user: {
          id: unifiedUser.id,
          email: unifiedUser.email,
          name: unifiedUser.name,
        }
      } as any;
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener businessId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessId: true, role: true }
    });

    if (!user?.businessId || user.role === 'STAFF') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { cedula } = params;

    // Buscar cliente por cédula o ID (compatibilidad)
    const searchCondition = cedula.startsWith('cl') && cedula.length > 20
      ? { id: cedula }
      : { cedula: cedula };

    const cliente = await prisma.cliente.findFirst({
      where: {
        ...searchCondition,
        businessId: user.businessId
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        cedula: cliente.cedula,
        correo: cliente.correo,
        telefono: cliente.telefono,
        puntos: cliente.puntos
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/clientes/[cedula]
 * Actualizar datos de un cliente
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cedula: string } }
) {
  try {
    // Intentar primero con NextAuth
    let session = await getServerSession(authOptions);
    
    // Log detallado para debugging
    console.log('🔍 Debug PATCH cliente:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      fullSession: session,
      headers: {
        authorization: request.headers.get('authorization'),
        cookie: request.headers.get('cookie'),
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer')
      }
    });

    // Si NextAuth no funciona, intentar con middleware unificado como fallback
    if (!session?.user?.id) {
      console.log('🔄 NextAuth failed, trying unified middleware...');
      
      const authResult = await requireAuth(request, { 
        role: 'ADMIN',
        allowSuperAdmin: true 
      });
      
      if ('error' in authResult) {
        console.error('❌ Unified middleware also failed');
        return authResult.error;
      }
      
      // Convertir usuario del middleware unificado a formato de sesión
      const unifiedUser = authResult.user;
      session = {
        user: {
          id: unifiedUser.id,
          email: unifiedUser.email,
          name: unifiedUser.name,
        }
      } as any;
      
      console.log('✅ Using unified middleware user:', unifiedUser.id);
    }

    if (!session?.user?.id) {
      console.error('❌ No hay sesión válida con ningún método');
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener businessId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessId: true, role: true }
    });

    console.log('👤 Usuario encontrado:', { 
      userId: session.user.id, 
      businessId: user?.businessId, 
      role: user?.role 
    });

    if (!user?.businessId || user.role === 'STAFF') {
      console.error('❌ Usuario no autorizado o sin businessId');
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { cedula } = params;
    const body = await request.json();
    const { nombre, correo, telefono, puntos, nuevaCedula } = body;

    // Buscar cliente por cédula o ID (compatibilidad)
    const searchCondition = cedula.startsWith('cl') && cedula.length > 20
      ? { id: cedula }
      : { cedula: cedula };

    const cliente = await prisma.cliente.findFirst({
      where: {
        ...searchCondition,
        businessId: user.businessId
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Si se está cambiando la cédula, verificar que no exista
    if (nuevaCedula && nuevaCedula !== cliente.cedula) {
      const existingCliente = await prisma.cliente.findFirst({
        where: {
          cedula: nuevaCedula,
          businessId: user.businessId,
          id: { not: cliente.id }
        }
      });

      if (existingCliente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con esa cédula' },
          { status: 400 }
        );
      }
    }

    // Actualizar cliente
    const updatedCliente = await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        nombre: nombre || cliente.nombre,
        cedula: nuevaCedula || cliente.cedula,
        correo: correo || cliente.correo,
        telefono: telefono || cliente.telefono,
        puntos: puntos ?? cliente.puntos
      }
    });

    return NextResponse.json({
      success: true,
      cliente: {
        id: updatedCliente.id,
        nombre: updatedCliente.nombre,
        cedula: updatedCliente.cedula,
        correo: updatedCliente.correo,
        telefono: updatedCliente.telefono,
        puntos: updatedCliente.puntos
      }
    });

  } catch (error) {
    console.error('❌ Error actualizando cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clientes/[cedula]
 * Eliminar un cliente
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { cedula: string } }
) {
  try {
    // Intentar primero con NextAuth
    let session = await getServerSession(authOptions);
    
    // Si NextAuth no funciona, intentar con middleware unificado como fallback
    if (!session?.user?.id) {
      const authResult = await requireAuth(request, { 
        role: 'ADMIN',
        allowSuperAdmin: true 
      });
      
      if ('error' in authResult) {
        return authResult.error;
      }
      
      // Convertir usuario del middleware unificado a formato de sesión
      const unifiedUser = authResult.user;
      session = {
        user: {
          id: unifiedUser.id,
          email: unifiedUser.email,
          name: unifiedUser.name,
        }
      } as any;
    }
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener businessId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessId: true, role: true }
    });

    if (!user?.businessId || user.role === 'STAFF') {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { cedula } = params;

    // Buscar cliente por cédula o ID (compatibilidad)
    const searchCondition = cedula.startsWith('cl') && cedula.length > 20
      ? { id: cedula }
      : { cedula: cedula };

    const cliente = await prisma.cliente.findFirst({
      where: {
        ...searchCondition,
        businessId: user.businessId
      }
    });

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar cliente
    await prisma.cliente.delete({
      where: { id: cliente.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
