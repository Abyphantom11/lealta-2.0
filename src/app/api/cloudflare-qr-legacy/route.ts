import { NextRequest, NextResponse } from 'next/server';

// 🔄 INTERCEPTOR ESPECÍFICO PARA QR DE CLOUDFLARE QUE VA A MORIR
// Este endpoint captura requests para: loud-entity-fluid-trade.trycloudflare.com/r/ig4gRl
// Y los redirecciona a: https://lealta.app/r/ig4gRl

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  console.log('🌩️ Cloudflare QR Legacy Interceptor activated');
  console.log('📍 Request details:', {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    userAgent: request.headers.get('user-agent')
  });
  
  // Redirigir al QR permanente en lealta.app
  const permanentQRUrl = 'https://lealta.app/r/ig4gRl';
  
  console.log(`🔄 Redirecting legacy Cloudflare QR to: ${permanentQRUrl}`);
  
  // Redirección permanente 301
  return NextResponse.redirect(permanentQRUrl, {
    status: 301,
    headers: {
      'Cache-Control': 'public, max-age=31536000', // Cache por 1 año
      'X-Redirect-Reason': 'Cloudflare-QR-Legacy-Support'
    }
  });
}

// También manejar POST, PUT, etc por si acaso
export async function POST(request: NextRequest) {
  return GET(request);
}

export async function PUT(request: NextRequest) {
  return GET(request);
}
