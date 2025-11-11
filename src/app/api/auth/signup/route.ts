import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { logger } from '@/utils/production-logger';


// Forzar renderizado dinámico para esta ruta que usa headers
export const dynamic = 'force-dynamic';

// Helper para generar subdomain a partir del nombre del negocio
function generateSubdomain(businessName: string): string {
  return businessName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar espacios y caracteres especiales con guiones
    .replace(/^-+|-+$/g, '') // Remover guiones al inicio y final
    .substring(0, 30) // Limitar a 30 caracteres
    + '-' + Math.random().toString(36).substring(2, 6); // Agregar sufijo aleatorio
}

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
    )
    .optional(), // Opcional para el flujo simplificado
  contactEmail: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email de contacto inválido')
    .optional(), // Opcional para el flujo simplificado
  contactPhone: z
    .string()
    .regex(/^[0-9+\-() ]*$/, 'El teléfono solo puede contener números y símbolos +, -, (, )')
    .min(8, 'Teléfono debe tener al menos 8 dígitos')
    .max(15, 'Teléfono no puede tener más de 15 caracteres')
    .optional(),

  // Datos del SuperAdmin
  adminName: z
    .string()
    .min(2, 'Nombre del admin debe tener al menos 2 caracteres')
    .optional(), // Opcional
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').optional(), // Alias para adminName
  adminEmail: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email del admin inválido')
    .optional(),
  email: z.string().email('Email inválido').optional(), // Alias para adminEmail
  adminPassword: z
    .string()
    .min(6, 'Contraseña debe tener al menos 6 caracteres')
    .optional(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional(), // Alias

  // Control de trial
  trial: z.boolean().optional(), // Si es true, activa 14 días gratis

  // Verificación de email (opcional para el flujo completo)
  emailVerified: z.boolean().optional(),
  verificationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    // Normalizar datos (soportar ambos formatos: adminEmail/email, adminName/name, etc.)
    const adminEmail = validatedData.adminEmail || validatedData.email;
    const adminName = validatedData.adminName || validatedData.name;
    const adminPassword = validatedData.adminPassword || validatedData.password;
    const businessName = validatedData.businessName;
    const subdomain = validatedData.subdomain || generateSubdomain(businessName);

    // Validar que tengamos los campos necesarios
    if (!adminEmail || !adminName || !adminPassword) {
      return NextResponse.json(
        { error: 'Email, nombre y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar email si se requiere verificación
    if (validatedData.emailVerified && validatedData.verificationId) {
      const verification = await prisma.emailVerification.findUnique({
        where: { id: validatedData.verificationId },
      });

      if (!verification || !verification.verified || verification.email !== adminEmail) {
        return NextResponse.json(
          { error: 'Email no verificado. Por favor verifica tu email primero.' },
          { status: 400 }
        );
      }
    }

    // Verificar si el subdominio ya existe
    const existingBusiness = await prisma.business.findUnique({
      where: { subdomain },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'El subdominio ya está en uso' },
        { status: 409 }
      );
    }

    // Verificar si el email del admin ya existe en alguna empresa
    const existingAdmin = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'El email del administrador ya está registrado' },
        { status: 409 }
      );
    }

    // Crear empresa y SuperAdmin en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // ✅ TRIAL AUTOMÁTICO: Todos los nuevos usuarios tienen 14 días gratis
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
      
      const business = await tx.business.create({
        data: {
          name: businessName,
          slug: subdomain,
          subdomain: subdomain,
          subscriptionPlan: 'BASIC', // Plan inicial
          subscriptionStatus: 'trialing', // ✅ Siempre en trial al registrarse
          trialEndsAt: trialEndsAt, // ✅ 14 días desde hoy
          isActive: true,
        },
      });

      // Hash de la contraseña
      const passwordHash = await hash(adminPassword, 12);

      // Crear SuperAdmin
      const superAdmin = await tx.user.create({
        data: {
          businessId: business.id,
          email: adminEmail,
          passwordHash,
          name: adminName,
          role: 'SUPERADMIN',
          isActive: true,
        },
      });

      // Crear location por defecto
      await tx.location.create({
        data: {
          businessId: business.id,
          name: `${businessName} - Principal`,
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
      businessId: result.business.id, // Para usarlo en el frontend
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
      trial: validatedData.trial === true, // Indicar si tiene trial activo
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
