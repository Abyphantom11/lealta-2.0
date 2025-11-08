import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { logger } from '@/utils/production-logger';


// Forzar renderizado dinámico para esta ruta que usa headers
export const dynamic = 'force-dynamic';

const signupSchema = z.object({
  // Datos de la empresa
  businessName: z
    .string()
    .min(2, 'Nombre de negocio debe tener al menos 2 caracteres'),
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
  contactPhone: z
    .string()
    .regex(/^[0-9+\-() ]*$/, 'El teléfono solo puede contener números y símbolos +, -, (, )')
    .min(8, 'Teléfono debe tener al menos 8 dígitos')
    .max(15, 'Teléfono no puede tener más de 15 caracteres')
    .optional(),

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

  // Verificación de email (opcional para el flujo completo)
  emailVerified: z.boolean().optional(),
  verificationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Verificar email si se requiere verificación
    if (validatedData.emailVerified && validatedData.verificationId) {
      const verification = await prisma.emailVerification.findUnique({
        where: { id: validatedData.verificationId },
      });

      if (!verification || !verification.verified || verification.email !== validatedData.adminEmail) {
        return NextResponse.json(
          { error: 'Email no verificado. Por favor verifica tu email primero.' },
          { status: 400 }
        );
      }
    }

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
    const result = await prisma.$transaction(async (tx) => {
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

      // Crear metas por defecto para la empresa
      await tx.businessGoals.create({
        data: {
          businessId: business.id,
          // Los valores por defecto ya están definidos en el schema
        },
      });

      return { business, superAdmin };
    });

    // ✅ NUEVO: Crear portal-config personalizado inmediatamente después del signup
    try {
      const { createDefaultPortalConfig } = await import('../../../../lib/portal-config-utils');
      await createDefaultPortalConfig(result.business.id, result.business.name);
      logger.debug(`🎨 Portal config created for new business: ${result.business.name} (${result.business.id})`);
    } catch (portalConfigError) {
      logger.error('⚠️ Could not create initial portal config:', {
        error: portalConfigError,
        message: portalConfigError instanceof Error ? portalConfigError.message : 'Unknown error',
        stack: portalConfigError instanceof Error ? portalConfigError.stack : undefined,
        businessId: result.business.id,
        businessName: result.business.name
      });
      // No fallar el signup por esto - se creará lazy cuando se acceda por primera vez
    }

    // 🚫 TEMPORALMENTE DESACTIVADO - Email de bienvenida
    // try {
    //   await sendEmail({
    //     to: validatedData.adminEmail,
    //     type: 'welcome',
    //     data: {
    //       businessName: validatedData.businessName,
    //       adminName: validatedData.adminName,
    //       loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    //     },
    //   });

    //   // Registrar el envío del email
    //   await prisma.emailLog.create({
    //     data: {
    //       to: validatedData.adminEmail,
    //       from: 'hello@lealta.app',
    //       subject: '🎉 ¡Bienvenido a Lealta!',
    //       type: 'welcome',
    //       status: 'sent',
    //       businessId: result.business.id,
    //     },
    //   });
    // } catch (emailError) {
    //   console.error('❌ Error enviando email de bienvenida:', emailError);
    //   // No fallamos el registro por error de email
    // }

    return NextResponse.json({
      success: true,
      message: 'Negocio y administrador creados exitosamente',
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
    logger.error('❌ Signup error:', error);

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
