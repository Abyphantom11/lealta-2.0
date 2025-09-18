// 📱 QR Generator Nativo - Lealta 2.0
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/requireAuth';

// 🔥 QR Generator sin librerías externas usando API nativa
export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      const body = await request.json();
      const { tipo, datos, businessId } = body;

      // Validar que el usuario puede generar QRs para este business
      if (session.businessId !== businessId && session.role !== 'superadmin') {
        return NextResponse.json({ error: 'No autorizado para este negocio' }, { status: 403 });
      }

      let qrData = '';
      let fileName = '';

      switch (tipo) {
        case 'CONTACTO':
          // Generar vCard para contacto
          qrData = generateVCard({
            name: datos.nombre,
            phone: datos.telefono,
            email: datos.email,
            organization: datos.empresa,
            url: datos.website
          });
          fileName = `contacto-${datos.nombre.replace(/\s+/g, '-')}.png`;
          break;

        case 'WIFI':
          // Generar QR para WiFi
          qrData = `WIFI:T:${datos.security};S:${datos.ssid};P:${datos.password};H:${datos.hidden};;`;
          fileName = `wifi-${datos.ssid}.png`;
          break;

        case 'CLIENTE_REGISTRO':
          // QR para registro rápido de cliente
          const registroUrl = `${process.env.NEXTAUTH_URL}/${businessId}/cliente?ref=qr&codigo=${datos.codigoReferencia}`;
          qrData = registroUrl;
          fileName = `registro-cliente-${businessId}.png`;
          break;

        case 'MENU':
          // QR para acceso directo al menú
          const menuUrl = `${process.env.NEXTAUTH_URL}/${businessId}/cliente?page=menu`;
          qrData = menuUrl;
          fileName = `menu-${businessId}.png`;
          break;

        case 'PUNTOS':
          // QR para verificar puntos del cliente
          const puntosUrl = `${process.env.NEXTAUTH_URL}/${businessId}/cliente?cedula=${datos.cedula}&action=puntos`;
          qrData = puntosUrl;
          fileName = `puntos-cliente-${datos.cedula}.png`;
          break;

        default:
          return NextResponse.json({ error: 'Tipo de QR no soportado' }, { status: 400 });
      }

      // Generar QR usando API gratuita
      const qrImageUrl = await generateQRImage(qrData, {
        size: datos.size || 200,
        errorCorrection: 'M',
        margin: datos.margin || 4,
        darkColor: datos.darkColor || '#000000',
        lightColor: datos.lightColor || '#FFFFFF'
      });

      return NextResponse.json({
        success: true,
        qr: {
          data: qrData,
          imageUrl: qrImageUrl,
          fileName: fileName,
          tipo: tipo,
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error generando QR:', error);
      return NextResponse.json({ 
        error: 'Error interno generando QR' 
      }, { status: 500 });
    }
  });
}

// 📇 Generar vCard para contactos
function generateVCard(contact: {
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
  url?: string;
}): string {
  let vcard = 'BEGIN:VCARD\n';
  vcard += 'VERSION:3.0\n';
  vcard += `FN:${contact.name}\n`;
  
  if (contact.phone) {
    vcard += `TEL:${contact.phone}\n`;
  }
  
  if (contact.email) {
    vcard += `EMAIL:${contact.email}\n`;
  }
  
  if (contact.organization) {
    vcard += `ORG:${contact.organization}\n`;
  }
  
  if (contact.url) {
    vcard += `URL:${contact.url}\n`;
  }
  
  vcard += 'END:VCARD';
  return vcard;
}

// 🎨 Generar imagen QR usando API gratuita
async function generateQRImage(data: string, options: {
  size: number;
  errorCorrection: string;
  margin: number;
  darkColor: string;
  lightColor: string;
}): Promise<string> {
  
  // Opción 1: API gratuita qr-server.com
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?` +
    `size=${options.size}x${options.size}&` +
    `data=${encodeURIComponent(data)}&` +
    `ecc=${options.errorCorrection}&` +
    `margin=${options.margin}&` +
    `color=${options.darkColor.replace('#', '')}&` +
    `bgcolor=${options.lightColor.replace('#', '')}`;

  return qrUrl;
}

// 🔄 GET - Listar QRs generados
export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      const { searchParams } = new URL(request.url);
      const businessId = searchParams.get('businessId');

      // Validar acceso al business
      if (session.businessId !== businessId && session.role !== 'superadmin') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      // Aquí podrías guardar historial de QRs en DB si necesitas
      // Por ahora retornamos templates disponibles
      const qrTemplates = [
        {
          id: 'contacto',
          nombre: 'Tarjeta de Contacto',
          descripcion: 'QR con información de contacto (vCard)',
          campos: ['nombre', 'telefono', 'email', 'empresa', 'website']
        },
        {
          id: 'wifi',
          nombre: 'Acceso WiFi',
          descripcion: 'QR para conectar automáticamente a WiFi',
          campos: ['ssid', 'password', 'security', 'hidden']
        },
        {
          id: 'cliente_registro',
          nombre: 'Registro de Cliente',
          descripcion: 'QR para registro rápido en el sistema de fidelización',
          campos: ['codigoReferencia']
        },
        {
          id: 'menu',
          nombre: 'Acceso al Menú',
          descripcion: 'QR para ver el menú digital del restaurante',
          campos: []
        },
        {
          id: 'puntos',
          nombre: 'Consultar Puntos',
          descripcion: 'QR para que cliente vea sus puntos',
          campos: ['cedula']
        }
      ];

      return NextResponse.json({
        success: true,
        templates: qrTemplates
      });

    } catch (error) {
      console.error('Error obteniendo templates QR:', error);
      return NextResponse.json({ 
        error: 'Error interno' 
      }, { status: 500 });
    }
  });
}
