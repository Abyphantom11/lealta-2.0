import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      company, 
      name, 
      phone,
      businessType,
      expectedLocations,
      currentSolution,
      referralSource 
    } = await request.json();

    // Validaciones básicas
    if (!email || !company || !name) {
      return NextResponse.json(
        { error: 'Email, empresa y nombre son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe el email
    const existingTrial = await prisma.trialUser.findUnique({
      where: { email }
    });

    if (existingTrial) {
      return NextResponse.json(
        { error: 'Este email ya tiene un trial activo' },
        { status: 400 }
      );
    }

    // Generar token único
    const trialToken = crypto.randomUUID();
    
    // Fecha de expiración (14 días)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    // Crear usuario de trial
    const trialUser = await prisma.trialUser.create({
      data: {
        email,
        company,
        name,
        phone,
        trialToken,
        expiresAt,
        businessType,
        expectedLocations: expectedLocations ? parseInt(expectedLocations) : null,
        currentSolution,
        referralSource,
        activatedAt: new Date(), // Acceso inmediato (opción híbrida)
      }
    });

    // Enviar email de bienvenida
    try {
      await resend.emails.send({
        from: 'trials@lealta.app',
        to: email,
        subject: '🚀 Bienvenido a tu Trial de Lealta - Acceso Activado',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; border-radius: 16px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">¡Bienvenido a Lealta!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Tu trial de 14 días está activo</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #3b82f6; margin-bottom: 20px;">Hola ${name},</h2>
              
              <p style="line-height: 1.6; margin-bottom: 20px;">
                Tu cuenta trial para <strong>${company}</strong> está lista. Tienes acceso completo a todas las funcionalidades enterprise de Lealta por los próximos 14 días.
              </p>
              
              <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #60a5fa; margin-top: 0;">🎯 ¿Qué puedes hacer ahora?</h3>
                <ul style="line-height: 1.8; padding-left: 20px;">
                  <li>Acceder al dashboard enterprise completo</li>
                  <li>Configurar múltiples ubicaciones</li>
                  <li>Probar la IA de reconocimiento de productos</li>
                  <li>Analizar datos en tiempo real</li>
                  <li>Configurar el sistema de fidelización</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/login?trial=${trialToken}" 
                   style="display: inline-block; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  🚀 Acceder a mi Trial
                </a>
              </div>
              
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin: 25px 0;">
                <h3 style="color: #34d399; margin-top: 0;">📅 Detalles de tu Trial</h3>
                <p style="margin: 5px 0;"><strong>Empresa:</strong> ${company}</p>
                <p style="margin: 5px 0;"><strong>Expira:</strong> ${expiresAt.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p style="margin: 5px 0;"><strong>Soporte:</strong> hello@lealta.app</p>
              </div>
              
              <p style="line-height: 1.6; margin-top: 30px; opacity: 0.8; font-size: 14px;">
                ¿Preguntas? Responde a este email o escríbenos a <a href="mailto:hello@lealta.app" style="color: #3b82f6;">hello@lealta.app</a>
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: rgba(0,0,0,0.3); padding: 20px 30px; text-align: center; opacity: 0.7; font-size: 12px;">
              <p>Lealta - Plataforma de Inteligencia y Escalabilidad Comercial</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // No fallar si el email falla, el trial sigue activo
    }

    return NextResponse.json({
      success: true,
      message: 'Trial activado exitosamente',
      trialToken,
      expiresAt: expiresAt.toISOString(),
      accessUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login?trial=${trialToken}`
    });

  } catch (error) {
    console.error('Error creating trial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
