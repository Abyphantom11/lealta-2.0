import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token requerido' },
        { status: 400 }
      );
    }

    const trialUser = await prisma.trialUser.findUnique({
      where: { trialToken: token }
    });

    if (!trialUser) {
      return NextResponse.json(
        { error: 'Trial no encontrado' },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = now > trialUser.expiresAt;
    const daysRemaining = Math.max(0, Math.ceil((trialUser.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Actualizar última conexión
    await prisma.trialUser.update({
      where: { id: trialUser.id },
      data: { lastLoginAt: now }
    });

    return NextResponse.json({
      success: true,
      trial: {
        id: trialUser.id,
        email: trialUser.email,
        company: trialUser.company,
        name: trialUser.name,
        isActive: trialUser.isActive && !isExpired,
        isExpired,
        daysRemaining,
        expiresAt: trialUser.expiresAt.toISOString(),
        hasUpgraded: trialUser.hasUpgraded,
        createdAt: trialUser.createdAt.toISOString(),
        activatedAt: trialUser.activatedAt?.toISOString(),
      }
    });

  } catch (error) {
    console.error('Error checking trial status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (!token || !action) {
      return NextResponse.json(
        { error: 'Token y acción requeridos' },
        { status: 400 }
      );
    }

    const trialUser = await prisma.trialUser.findUnique({
      where: { trialToken: token }
    });

    if (!trialUser) {
      return NextResponse.json(
        { error: 'Trial no encontrado' },
        { status: 404 }
      );
    }

    if (action === 'extend') {
      // Extender trial por 7 días más (solo una vez)
      const newExpiresAt = new Date(trialUser.expiresAt);
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      await prisma.trialUser.update({
        where: { id: trialUser.id },
        data: { 
          expiresAt: newExpiresAt,
          notificationsSent: trialUser.notificationsSent + 1 
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Trial extendido por 7 días',
        newExpiresAt: newExpiresAt.toISOString()
      });
    }

    if (action === 'upgrade') {
      await prisma.trialUser.update({
        where: { id: trialUser.id },
        data: { hasUpgraded: true }
      });

      return NextResponse.json({
        success: true,
        message: 'Trial marcado como actualizado'
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating trial:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
