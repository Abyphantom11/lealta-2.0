import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extraer el shortId de la URL original de Cloudflare
    const pathSegments = url.pathname.split('/');
    const shortId = pathSegments[pathSegments.length - 1]; // Último segmento
    
    console.log('🔄 Cloudflare Redirect intercepted:', {
      originalUrl: request.url,
      shortId: shortId,
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    });
    
    // Verificar que el shortId es válido
    if (!shortId || shortId.length < 3) {
      console.log('❌ Invalid shortId:', shortId);
      return NextResponse.redirect(new URL('https://lealta.app', request.url));
    }
    
    // Redireccionar a la URL de lealta.app que manejará el QR
    const lealtaUrl = `https://lealta.app/r/${shortId}`;
    
    console.log('✅ Redirecting to lealta.app:', lealtaUrl);
    
    return NextResponse.redirect(lealtaUrl, 301); // Redirección permanente
    
  } catch (error) {
    console.error('❌ Error in Cloudflare redirect:', error);
    return NextResponse.redirect(new URL('https://lealta.app', request.url));
  }
}
