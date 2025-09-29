import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// API para probar la generación y escaneo de QR codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    if (action === 'list') {
      // Listar todos los QR codes con su estado de expiración
      const qrCodes = await prisma.reservationQRCode.findMany({
        include: {
          reservation: {
            include: {
              cliente: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      const now = new Date();
      const results = qrCodes.map(qr => ({
        id: qr.id,
        qrToken: qr.qrToken,
        status: qr.status,
        scanCount: qr.scanCount,
        maxScans: qr.reservation.guestCount,
        isExpired: qr.expiresAt ? now > qr.expiresAt : false,
        expiresAt: qr.expiresAt?.toISOString(),
        timeUntilExpiry: qr.expiresAt ? Math.max(0, qr.expiresAt.getTime() - now.getTime()) : null,
        customerName: qr.reservation.customerName,
        reservationDate: qr.reservation.reservationDate,
        reservationTime: qr.reservation.reservationTime,
        createdAt: qr.createdAt.toISOString()
      }));

      return NextResponse.json({
        success: true,
        message: `Found ${results.length} QR codes`,
        qrCodes: results
      });
    }

    if (action === 'check-expiry') {
      // Verificar y actualizar QR codes expirados
      const now = new Date();
      
      const expiredQRs = await prisma.reservationQRCode.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lt: now
          }
        }
      });

      // Marcar como expirados
      const updateResult = await prisma.reservationQRCode.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lt: now
          }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      return NextResponse.json({
        success: true,
        message: `Updated ${updateResult.count} expired QR codes`,
        expiredQRs: expiredQRs.map(qr => ({
          qrToken: qr.qrToken,
          expiresAt: qr.expiresAt?.toISOString(),
          hoursOverdue: qr.expiresAt ? 
            Math.round((now.getTime() - qr.expiresAt.getTime()) / (1000 * 60 * 60) * 10) / 10 : 0
        }))
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action. Use ?action=list or ?action=check-expiry'
    });

  } catch (error) {
    console.error('Error in test-qr API:', error);
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// API para simular el escaneo de QR
export async function POST(request: NextRequest) {
  try {
    const { qrToken, increment = 1 } = await request.json();

    if (!qrToken) {
      return NextResponse.json({
        success: false,
        message: 'qrToken requerido'
      }, { status: 400 });
    }

    // Simular escaneo usando nuestra API de scanner
    const scanResponse = await fetch(`${request.nextUrl.origin}/api/reservas/scanner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrToken, increment })
    });

    const scanResult = await scanResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Scan simulation completed',
      scanResult
    });

  } catch (error) {
    console.error('Error simulating QR scan:', error);
    return NextResponse.json({
      success: false,
      message: 'Error en simulación de escaneo',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
