import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { shortId: string } }
) {
  try {
    const { shortId } = params;
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    console.log('🔍 QR Redirect Request:', {
      shortId,
      ip,
      userAgent: userAgent.substring(0, 100)
    });

    // Buscar el QR link en la base de datos
    const qrLink = await prisma.qRLink.findUnique({
      where: { shortId }
    });
    
    if (!qrLink) {
      console.log('❌ QR Link no encontrado:', shortId);
      
      // Página de error personalizada
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR No Encontrado</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-align: center;
            }
            .container { 
              max-width: 400px; 
              padding: 2rem; 
              background: rgba(255,255,255,0.1); 
              border-radius: 20px; 
              backdrop-filter: blur(10px);
            }
            h1 { margin-bottom: 1rem; font-size: 2rem; }
            p { opacity: 0.9; line-height: 1.6; }
            .qr-code { font-family: monospace; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔍 QR No Encontrado</h1>
            <p>El código QR que escaneaste no existe o ha expirado.</p>
            <div class="qr-code">ID: ${shortId}</div>
            <p><small>Si crees que esto es un error, contacta al administrador.</small></p>
          </div>
        </body>
        </html>
        `,
        { 
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Verificar si está activo
    if (!qrLink.isActive) {
      console.log('⚠️ QR Link inactivo:', shortId);
      
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Inactivo</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
              color: #2d3436;
              text-align: center;
            }
            .container { 
              max-width: 400px; 
              padding: 2rem; 
              background: rgba(255,255,255,0.9); 
              border-radius: 20px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            h1 { margin-bottom: 1rem; font-size: 2rem; }
            p { line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ QR Temporalmente Inactivo</h1>
            <p>Este código QR está temporalmente desactivado.</p>
            <p><strong>Nombre:</strong> ${qrLink.name}</p>
            <p><small>Inténtalo más tarde o contacta al administrador.</small></p>
          </div>
        </body>
        </html>
        `,
        { 
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Verificar si ha expirado
    if (qrLink.expiresAt && new Date() > qrLink.expiresAt) {
      console.log('⏰ QR Link expirado:', shortId);
      
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Expirado</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%);
              color: white;
              text-align: center;
            }
            .container { 
              max-width: 400px; 
              padding: 2rem; 
              background: rgba(0,0,0,0.1); 
              border-radius: 20px; 
              backdrop-filter: blur(10px);
            }
            h1 { margin-bottom: 1rem; font-size: 2rem; }
            p { line-height: 1.6; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ QR Expirado</h1>
            <p>Este código QR expiró el ${qrLink.expiresAt.toLocaleDateString()}.</p>
            <p><strong>Campaña:</strong> ${qrLink.name}</p>
            <p><small>Contacta al administrador para obtener un nuevo código.</small></p>
          </div>
        </body>
        </html>
        `,
        { 
          status: 410,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Registrar el click en la base de datos
    try {
      await prisma.qRClick.create({
        data: {
          qrLinkId: qrLink.id,
          ipAddress: ip,
          userAgent: userAgent.substring(0, 500), // Limitar longitud
          referer: request.headers.get('referer') || null
        }
      });
      console.log('✅ Click registrado para QR:', shortId);
    } catch (clickError) {
      console.error('⚠️ Error registrando click (continuando):', clickError);
    }

    // Intentar redirección a URL principal
    try {
      // � LÓGICA ESPECÍFICA PARA ig4gRl CON NAVEGADORES PROBLEMÁTICOS
      const isIG4gRlQR = shortId === 'ig4gRl';
      const isSafari = userAgent.includes('Safari') && !userAgent.includes('Chrome');
      const isOpera = userAgent.includes('OPR/');
      const isEdge = userAgent.includes('Edg/');
      const isProblematicBrowser = isSafari || isOpera || isEdge;

      console.log('🔍 Detección:', {
        shortId,
        isIG4gRlQR,
        isSafari,
        isOpera,
        isEdge,
        isProblematicBrowser,
        userAgent: userAgent.substring(0, 100),
        targetUrl: qrLink.targetUrl
      });

      // Si es navegador problemático y es el QR ig4gRl, usar siempre la URL de respaldo de GitHub
      if (isProblematicBrowser && isIG4gRlQR) {
        console.log('� Navegador problemático detectado con QR ig4gRl, usando URL de respaldo de GitHub');
        
        // Determinar tipo de navegador para logging
        let browserType = 'UNKNOWN';
        if (isSafari) browserType = 'SAFARI';
        else if (isOpera) browserType = 'OPERA';
        else if (isEdge) browserType = 'EDGE';
        
        const githubUrl = qrLink.backupUrl || 'https://abyphantom11.github.io/Men-/';

        // Registrar la redirección específica de ig4gRl
        try {
          await prisma.qRClick.create({
            data: {
              qrLinkId: qrLink.id,
              ipAddress: ip,
              userAgent: `${browserType}_IG4GRL_GITHUB: ${userAgent.substring(0, 330)}`,
              referer: request.headers.get('referer') || null
            }
          });
        } catch (fallbackError) {
          console.error('⚠️ Error registrando click fallback ig4gRl:', fallbackError);
        }

        console.log(`🔄 Redirigiendo ${browserType} desde ig4gRl a GitHub:`, githubUrl);
        return NextResponse.redirect(githubUrl, 302);
      }

      // Detectar túneles generales para otros QRs
      const lhrPattern = /https?:\/\/[a-f0-9-]+\.lhr\.life/;
      const ngrokPattern = /https?:\/\/[a-f0-9-]+\.eu\.ngrok\.io/;
      const isCloudflareUrl = qrLink.targetUrl.includes('.cloudflareaccess.com') || 
                             qrLink.targetUrl.includes('.trycloudflare.com') ||
                             qrLink.targetUrl.includes('-tunnel.com') ||
                             qrLink.targetUrl.includes('localhost:') ||
                             lhrPattern.test(qrLink.targetUrl) ||
                             ngrokPattern.test(qrLink.targetUrl);

      // Fallback general para otros túneles con navegadores problemáticos (no ig4gRl)
      if (isProblematicBrowser && isCloudflareUrl && !isIG4gRlQR) {
        console.log('� Navegador problemático detectado con túnel Cloudflare general, redirigiendo a fallback');
        const fallbackUrl = 'https://lealta.app/r/ig4gRl';
        
        // Registrar la redirección de fallback general
        try {
          await prisma.qRClick.create({
            data: {
              qrLinkId: qrLink.id,
              ipAddress: ip,
              userAgent: `SAFARI_GENERAL_FALLBACK: ${userAgent.substring(0, 350)}`,
              referer: request.headers.get('referer') || null
            }
          });
        } catch (fallbackError) {
          console.error('⚠️ Error registrando click fallback general:', fallbackError);
        }
        
        console.log('🔄 Redirigiendo Safari a fallback general:', fallbackUrl);
        return NextResponse.redirect(fallbackUrl, 302);
      }

      // Verificar que la URL es válida
      new URL(qrLink.targetUrl);
      
      console.log('🎯 Redirigiendo a:', qrLink.targetUrl);
      
      // Usar NextResponse.redirect para redirección externa
      return NextResponse.redirect(qrLink.targetUrl, 302);
      
    } catch (urlError) {
      console.error('❌ Error con URL principal, intentando backup:', urlError);
      
      // Si hay URL de backup, intentar usarla
      if (qrLink.backupUrl) {
        try {
          new URL(qrLink.backupUrl);
          console.log('🔄 Redirigiendo a backup:', qrLink.backupUrl);
          return NextResponse.redirect(qrLink.backupUrl, 302);
        } catch (backupError) {
          console.error('❌ URL backup también falló:', backupError);
        }
      }
      
      // Si nada funciona, mostrar página de error
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error de Redirección</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #e55656 0%, #c44569 100%);
              color: white;
              text-align: center;
            }
            .container { 
              max-width: 400px; 
              padding: 2rem; 
              background: rgba(0,0,0,0.1); 
              border-radius: 20px; 
              backdrop-filter: blur(10px);
            }
            h1 { margin-bottom: 1rem; font-size: 2rem; }
            p { line-height: 1.6; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error de Redirección</h1>
            <p>Hubo un problema con el destino de este QR code.</p>
            <p><strong>Campaña:</strong> ${qrLink.name}</p>
            <p><small>El administrador ha sido notificado del problema.</small></p>
          </div>
        </body>
        </html>
        `,
        { 
          status: 500,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }
    
  } catch (error) {
    console.error('💥 Error en QR redirect:', error);
    
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Interno</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            background: #2d3436;
            color: white;
            text-align: center;
          }
          .container { 
            max-width: 400px; 
            padding: 2rem; 
            background: rgba(255,255,255,0.1); 
            border-radius: 20px; 
            backdrop-filter: blur(10px);
          }
          h1 { margin-bottom: 1rem; font-size: 2rem; }
          p { line-height: 1.6; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>💥 Error Interno</h1>
          <p>Ocurrió un error inesperado al procesar el QR code.</p>
          <p><small>Por favor, inténtalo de nuevo o contacta al soporte.</small></p>
        </div>
      </body>
      </html>
      `,
      { 
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}
