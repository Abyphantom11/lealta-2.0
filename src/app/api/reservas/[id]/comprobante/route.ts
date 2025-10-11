import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getBlobStorageToken } from '@/lib/blob-storage-utils';
import { prisma } from '@/lib/prisma';

// POST: Subir comprobante de pago
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;
    
    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos de imagen' },
        { status: 400 }
      );
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Verificar que la reserva existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Subir a Vercel Blob Storage
    const token = getBlobStorageToken();
    
    if (!token) {
      return NextResponse.json(
        { error: 'Servicio de almacenamiento no disponible' },
        { status: 500 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `comprobantes/${reservationId}-${timestamp}-${file.name}`;
    
    // Subir archivo
    const blob = await put(fileName, file, {
      access: 'public',
      token: token
    });

    // Actualizar reserva con URL del comprobante en metadata
    const currentMetadata = reservation.metadata as any || {};
    const updatedMetadata = {
      ...currentMetadata,
      comprobanteUrl: blob.url,
      comprobanteUploadedAt: new Date().toISOString()
    };

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        metadata: updatedMetadata
      },
      include: {
        cliente: true,
        service: true,
        slot: true,
        promotor: true,
        qrCodes: true
      }
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      reserva: updatedReservation
    });

  } catch (error: any) {
    console.error('Error subiendo comprobante:', error);
    return NextResponse.json(
      { error: error.message || 'Error al subir el comprobante' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar comprobante de pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = params.id;

    // Verificar que la reserva existe
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar URL del comprobante del metadata
    const currentMetadata = reservation.metadata as any || {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { comprobanteUrl, comprobanteUploadedAt, ...restMetadata } = currentMetadata;

    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        metadata: restMetadata
      },
      include: {
        cliente: true,
        service: true,
        slot: true,
        promotor: true,
        qrCodes: true
      }
    });

    return NextResponse.json({
      success: true,
      reserva: updatedReservation
    });

  } catch (error: any) {
    console.error('Error eliminando comprobante:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar el comprobante' },
      { status: 500 }
    );
  }
}
