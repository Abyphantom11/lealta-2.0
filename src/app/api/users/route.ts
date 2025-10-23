import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { requireAuth, canCreateRole } from '../../../lib/auth/unified-middleware';

// Forzar renderizado dinámico para esta ruta que usa autenticación
export const dynamic = 'force-dynamic';

// Schema para creación de usuarios
const createUserSchema = z.object({
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  name: z.string().min(1, 'Nombre requerido'),
  role: z.enum(['ADMIN', 'STAFF']),
});

// Schema para actualización de usuarios
const updateUserSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres').optional(),
});

// Helper para verificar si puede gestionar un usuario
async function canManageUser(
  managerUserId: string,
  targetUserId: string
): Promise<boolean> {
  // Permitir que cualquier usuario se gestione a sí mismo
  if (managerUserId === targetUserId) return true;

  const [manager, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: managerUserId } }),
    prisma.user.findUnique({ where: { id: targetUserId } }),
  ]);

  if (!manager || !target) return false;
  if (manager.businessId !== target.businessId) return false;

  // SUPERADMIN puede gestionar todos los usuarios en su business
  if (manager.role === 'SUPERADMIN') return true;

  // ADMIN solo puede gestionar STAFF que él creó
  if (
    manager.role === 'ADMIN' &&
    target.role === 'STAFF' &&
    target.createdBy === manager.id
  ) {
    return true;
  }

  return false;
}

// GET /api/users - Listar usuarios del business
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request, {
    role: 'ADMIN',
    permission: 'users.read',
    allowSuperAdmin: true
  });

  if (auth.error) return auth.error;
  
  const { user: currentUser } = auth;

  try {
    const whereClause: Record<string, unknown> = {
      businessId: currentUser.businessId,
      isActive: true,
    };

    // ADMIN solo puede ver usuarios que él creó (STAFF)
    if (currentUser.role === 'ADMIN') {
      whereClause.OR = [
        { createdBy: currentUser.id }, // Usuarios que él creó
        { id: currentUser.id }, // A sí mismo
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        createdBy: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('❌ [API /users GET] Error listing users:', error);
    return NextResponse.json(
      { error: 'Error obteniendo usuarios' },
      { status: 500 }
    );
  }
}

// POST /api/users - Crear nuevo usuario
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request, {
    role: 'ADMIN',
    permission: 'users.create',
    allowSuperAdmin: true
  });

  if (auth.error) return auth.error;
  
  const { user: currentUser } = auth;

  try {
    const body = await request.json();
    
    const { email, password, name, role } = createUserSchema.parse(body);

    // Verificar jerarquía de roles
    if (!canCreateRole(currentUser.role, role as any)) {
      return NextResponse.json(
        { error: `No puedes crear usuarios con rol ${role}` },
        { status: 403 }
      );
    }

    // ADMIN solo puede crear STAFF
    if (currentUser.role === 'ADMIN' && role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Solo puedes crear usuarios con rol STAFF' },
        { status: 403 }
      );
    }

    // Verificar que el email no existe en el business
    const existingUser = await prisma.user.findUnique({
      where: {
        businessId_email: {
          businessId: currentUser.businessId,
          email: email,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email ya registrado en esta empresa' },
        { status: 409 }
      );
    }

    // Hash del password
    const passwordHash = await hash(password, 12);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        businessId: currentUser.businessId,
        email,
        passwordHash,
        name,
        role,
        createdBy: currentUser.id,
        isActive: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('✅ [API /users POST] Usuario creado:', { id: newUser.id, email: newUser.email, role: newUser.role });

    return NextResponse.json(
      {
        success: true,
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ [API /users POST] Error creating user:', error);

    if (error instanceof z.ZodError) {
      console.log('❌ [API /users POST] Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error creando usuario' },
      { status: 500 }
    );
  }
}

// PUT /api/users - Actualizar usuario (requiere ID en body)
export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request, {
    role: 'ADMIN',
    permission: 'users.update',
    allowSuperAdmin: true
  });

  if (auth.error) return auth.error;
  
  const { user: currentUser } = auth;

  try {
    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Verificar si puede gestionar este usuario
    const canManage = await canManageUser(currentUser.id, userId);

    if (!canManage) {
      return NextResponse.json(
        { error: 'No tienes permisos para gestionar este usuario' },
        { status: 403 }
      );
    }

    const validatedData = updateUserSchema.parse(updateData);

    // Si hay password, hacer hash
    let dataToUpdate: any = { ...validatedData };
    if (validatedData.password) {
      const passwordHash = await hash(validatedData.password, 12);
      dataToUpdate = {
        ...validatedData,
        passwordHash,
      };
      delete dataToUpdate.password; // Eliminar password sin hash
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error actualizando usuario' },
      { status: 500 }
    );
  }
}

// DELETE /api/users - Desactivar usuario (requiere ID en body)
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request, {
    role: 'ADMIN',
    permission: 'users.delete',
    allowSuperAdmin: true
  });

  if (auth.error) return auth.error;
  
  const { user: currentUser } = auth;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // No puede eliminarse a sí mismo
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'No puedes desactivar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Verificar si puede gestionar este usuario
    const canManage = await canManageUser(currentUser.id, userId);

    if (!canManage) {
      return NextResponse.json(
        { error: 'No tienes permisos para gestionar este usuario' },
        { status: 403 }
      );
    }

    // Desactivar usuario (soft delete)
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        sessionToken: null, // Invalidar sesión
        sessionExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario desactivado correctamente',
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Error desactivando usuario' },
      { status: 500 }
    );
  }
}
