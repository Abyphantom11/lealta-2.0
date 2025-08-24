import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  cedula: z.string().min(6, 'Cédula debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  correo: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Correo electrónico inválido'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  consent: z.boolean().refine((val) => val === true, 'Debe aceptar los términos y condiciones'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if client already exists
    let cliente = await prisma.cliente.findUnique({
      where: { cedula: validatedData.cedula }
    });

    if (cliente) {
      // Update existing client and increment portal views
      cliente = await prisma.cliente.update({
        where: { cedula: validatedData.cedula },
        data: {
          nombre: validatedData.nombre,
          correo: validatedData.correo,
          telefono: validatedData.telefono,
          portalViews: { increment: 1 },
          lastLogin: new Date(),
        }
      });
    } else {
      // Create new client
      cliente = await prisma.cliente.create({
        data: {
          cedula: validatedData.cedula,
          nombre: validatedData.nombre,
          correo: validatedData.correo,
          telefono: validatedData.telefono,
          portalViews: 1,
          lastLogin: new Date(),
        }
      });
    }

    // Create visit log for portal visit
    await prisma.visitLog.create({
      data: {
        clienteId: cliente.id,
        action: 'portal_visit',
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      }
    });

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      customerId: cliente.id,
      message: 'Cliente registrado exitosamente'
    });

    // Set client cookie (not httpOnly for client access)
    response.cookies.set('clienteId', cliente.id, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    
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
