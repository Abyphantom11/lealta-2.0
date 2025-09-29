import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EstadoReserva } from '../../../reservas-new/types/reservation';

const prisma = new PrismaClient();

// Indicar a Next.js que esta ruta es dinámica
export const dynamic = 'force-dynamic';

// Interface para request de scan
interface ScanQRRequest {
  qrToken: string;
  increment?: number; // Cuántas personas registrar (default: 1)
}

// Interface para response de scan
interface ScanQRResponse {
  success: boolean;
  message: string;
  data?: {
    reservationId: string;
    customerName: string;
    currentCount: number;
    maxCount: number;
    status: string;
    scanCount: number;
  };
}

// Función para mapear estado de Prisma a nuestro tipo
function mapPrismaStatusToReserva(status: string): EstadoReserva {
  switch (status) {
    case 'CONFIRMED': return 'Activa';
    case 'IN_PROGRESS': return 'En Progreso';
    case 'COMPLETED': return 'En Camino';
    case 'CANCELLED': return 'Reserva Caída';
    default: return 'Activa';
  }
}

// POST /api/reservas/scanner - Procesar scan de código QR
export async function POST(request: NextRequest) {
  try {
    const body: ScanQRRequest = await request.json();
    const businessId = 'default-business-id'; // En producción vendría del contexto de auth

    if (!body.qrToken) {
      return NextResponse.json<ScanQRResponse>({
        success: false,
        message: 'Token QR requerido'
      }, { status: 400 });
    }

    // Buscar el código QR
    const qrCode = await prisma.reservationQRCode.findUnique({
      where: { qrToken: body.qrToken },
      include: {
        reservation: {
          include: {
            cliente: true,
            service: true,
            slot: true
          }
        }
      }
    });

    if (!qrCode) {
      return NextResponse.json<ScanQRResponse>({
        success: false,
        message: 'Código QR no válido o expirado'
      }, { status: 404 });
    }

    // Verificar que el QR pertenece al negocio correcto
    if (qrCode.businessId !== businessId) {
      return NextResponse.json<ScanQRResponse>({
        success: false,
        message: 'Código QR no válido para este negocio'
      }, { status: 403 });
    }

    // Verificar expiración del QR (12 horas después de la hora de la reserva)
    const now = new Date();
    if (qrCode.expiresAt && now > qrCode.expiresAt) {
      // Marcar como expirado si no lo está ya
      if (qrCode.status === 'ACTIVE') {
        await prisma.reservationQRCode.update({
          where: { id: qrCode.id },
          data: { status: 'EXPIRED' }
        });
      }
      
      return NextResponse.json<ScanQRResponse>({
        success: false,
        message: 'Código QR expirado. Los QR expiran 12 horas después de la hora de la reserva.'
      }, { status: 400 });
    }

    // Verificar que el QR está activo
    if (qrCode.status !== 'ACTIVE') {
      const statusMessages = {
        'EXPIRED': 'Código QR expirado',
        'USED': 'Código QR ya utilizado',
        'CANCELLED': 'Código QR cancelado'
      };
      
      return NextResponse.json<ScanQRResponse>({
        success: false,
        message: statusMessages[qrCode.status as keyof typeof statusMessages] || 'Código QR inactivo'
      }, { status: 400 });
    }

    // Verificar si la reserva está cancelada
    if (qrCode.reservation.status === 'CANCELLED') {
      return NextResponse.json<ScanQRResponse>({
        success: false,
        message: 'Esta reserva ha sido cancelada'
      }, { status: 400 });
    }

    const reservation = qrCode.reservation;
    const increment = body.increment || 1;
    const newScanCount = qrCode.scanCount + increment;

    // Actualizar el contador de escaneos del QR
    await prisma.reservationQRCode.update({
      where: { id: qrCode.id },
      data: {
        scanCount: newScanCount,
        lastScannedAt: new Date(),
        usedAt: qrCode.usedAt || new Date(), // Marcar como usado si es la primera vez
        usedBy: qrCode.usedBy || 'Scanner'
      }
    });

    // Actualizar el estado de la reserva si es necesario
    let updatedStatus = reservation.status;
    if (reservation.status === 'CONFIRMED' && newScanCount > 0) {
      // Cambiar a "CHECKED_IN" al primer escaneo
      updatedStatus = 'CHECKED_IN';
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { 
          status: updatedStatus,
          checkedInAt: new Date()
        }
      });
    }

    // Crear log de auditoría
    await prisma.reservationQRCode.update({
      where: { id: qrCode.id },
      data: {
        scanCount: newScanCount,
        lastScannedAt: new Date(),
        usedAt: qrCode.usedAt || new Date(),
        usedBy: qrCode.usedBy || 'Scanner'
      }
    });

    await prisma.reservationAuditLog.create({
      data: {
        businessId: businessId,
        reservationId: reservation.id,
        action: 'scanned',
        userName: 'Scanner',
        metadata: JSON.stringify({
          qrToken: body.qrToken,
          increment: increment,
          newScanCount: newScanCount,
          scanTimestamp: new Date().toISOString()
        })
      }
    });

    // Respuesta exitosa
    const response: ScanQRResponse = {
      success: true,
      message: `✅ ${reservation.customerName}: ${newScanCount}/${reservation.guestCount} personas registradas`,
      data: {
        reservationId: reservation.id,
        customerName: reservation.customerName,
        currentCount: newScanCount,
        maxCount: reservation.guestCount,
        status: mapPrismaStatusToReserva(updatedStatus),
        scanCount: newScanCount
      }
    };

    return NextResponse.json<ScanQRResponse>(response);

  } catch (error) {
    console.error('Error processing QR scan:', error);
    return NextResponse.json<ScanQRResponse>({
      success: false,
      message: 'Error interno del servidor'
    }, { status: 500 });
  }
}
