import { NextResponse } from 'next/server';

/**
 * ⚠️ ENDPOINT OBSOLETO
 * 
 * Este endpoint ya no se utiliza porque los QRs se comparten como imágenes
 * directamente (PNG + texto), no como links en base de datos.
 * 
 * El flujo actual es:
 * 1. Usuario crea reserva
 * 2. En detalles, se genera QR localmente con react-qr-code
 * 3. Al compartir, se crea imagen PNG y se envía por WhatsApp
 * 
 * No existe tabla QRShareLink en la base de datos.
 * Los QRs se visualizan directamente en el panel de reservas.
 */

export async function GET() {
  return NextResponse.json(
    { 
      error: 'Este código QR ya no está disponible',
      message: 'Los códigos QR se comparten ahora como imágenes directamente. Este link ha expirado.',
      code: 'QR_NOT_FOUND',
      deprecated: true
    },
    { status: 404 }
  );
}
