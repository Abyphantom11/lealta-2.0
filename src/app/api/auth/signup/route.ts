import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';

// Forzar renderizado dinámico para esta ruta que usa headers
export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  // Datos de la empresa
  businessName: z
    .string()
    .min(2, 'Nombre de empresa debe tener al menos 2 caracteres'),
  subdomain: z
    .string()
    .min(3, 'Subdominio debe tener al menos 3 caracteres')
    .regex(
      /^[a-z0-9-]+$/,
      'Subdominio solo puede contener letras, números y guiones'
    ),
  contactEmail: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email de contacto inválido'),
  contactPhone: z.string().optional(),

  // Datos del SuperAdmin
  adminName: z
    .string()
    .min(2, 'Nombre del admin debe tener al menos 2 caracteres'),
  adminEmail: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email del admin inválido'),
  adminPassword: z
    .string()
    .min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Verificar si el subdominio ya existe
    const existingBusiness = await prisma.business.findUnique({
      where: { subdomain: validatedData.subdomain },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'El subdominio ya está en uso' },
        { status: 409 }
      );
    }

    // Verificar si el email del admin ya existe en alguna empresa
    const existingAdmin = await prisma.user.findFirst({
      where: { email: validatedData.adminEmail },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'El email del administrador ya está registrado' },
        { status: 409 }
      );
    }

    // Crear empresa y SuperAdmin en una transacción
    const result = await prisma.$transaction(async (tx: any) => {
      // Crear Business
      const business = await tx.business.create({
        data: {
          name: validatedData.businessName,
          slug: validatedData.subdomain,
          subdomain: validatedData.subdomain,
          subscriptionPlan: 'BASIC', // Plan inicial
          isActive: true,
        },
      });

      // Hash de la contraseña
      const passwordHash = await hash(validatedData.adminPassword, 12);

      // Crear SuperAdmin
      const superAdmin = await tx.user.create({
        data: {
          businessId: business.id,
          email: validatedData.adminEmail,
          passwordHash,
          name: validatedData.adminName,
          role: 'SUPERADMIN',
          isActive: true,
        },
      });

      // Crear location por defecto
      await tx.location.create({
        data: {
          businessId: business.id,
          name: `${validatedData.businessName} - Principal`,
        },
      });

      return { business, superAdmin };
    });

    return NextResponse.json({
      success: true,
      message: 'Empresa y administrador creados exitosamente',
      business: {
        id: result.business.id,
        name: result.business.name,
        subdomain: result.business.subdomain,
      },
      admin: {
        id: result.superAdmin.id,
        name: result.superAdmin.name,
        email: result.superAdmin.email,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
