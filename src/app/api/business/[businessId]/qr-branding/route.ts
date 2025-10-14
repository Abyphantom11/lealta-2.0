import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { QRBrandingConfig, DEFAULT_QR_BRANDING } from '@/types/qr-branding';

// GET - Obtener configuración de QR Branding
export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    // Buscar business por ID o por slug
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessId },
          { slug: businessId }
        ]
      },
      select: {
        qrBrandingConfig: true,
        qrMensajeBienvenida: true,
        qrMostrarLogo: true,
        name: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    // Parsear config o usar valores por defecto
    let config: QRBrandingConfig = DEFAULT_QR_BRANDING;
    
    if (business.qrBrandingConfig && typeof business.qrBrandingConfig === 'object') {
      config = {
        ...DEFAULT_QR_BRANDING,
        ...(business.qrBrandingConfig as Partial<QRBrandingConfig>),
      };
    }

    // Override con campos específicos si existen
    if (business.qrMensajeBienvenida) {
      config.mensaje.texto = business.qrMensajeBienvenida;
    }
    
    config.header.mostrarLogo = business.qrMostrarLogo;
    config.header.nombreEmpresa = business.name;

    // También incluir cardDesign si existe en qrBrandingConfig
    const response: any = {
      success: true,
      data: config,
    };

    // Si hay cardDesign guardado, agregarlo
    if (business.qrBrandingConfig && typeof business.qrBrandingConfig === 'object') {
      const savedConfig = business.qrBrandingConfig as any;
      if (savedConfig.cardDesign) {
        response.data.cardDesign = savedConfig.cardDesign;
      }
      if (savedConfig.businessName) {
        response.data.businessName = savedConfig.businessName;
      }
      if (savedConfig.selectedTemplate) {
        response.data.selectedTemplate = savedConfig.selectedTemplate;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error al obtener configuración QR:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de QR Branding
export async function PUT(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const body = await request.json();

    // Validar que el negocio existe
    const businessExists = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!businessExists) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    // Extraer campos específicos
    const { mensaje, header } = body as Partial<QRBrandingConfig>;

    // Preparar datos para actualizar
    const updateData: any = {
      qrBrandingConfig: body, // Guardar config completa en JSON
    };

    // Actualizar campos específicos si vienen en el body
    if (mensaje?.texto) {
      updateData.qrMensajeBienvenida = mensaje.texto;
    }

    if (header?.mostrarLogo !== undefined) {
      updateData.qrMostrarLogo = header.mostrarLogo;
    }

    // Actualizar en base de datos
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updateData,
      select: {
        qrBrandingConfig: true,
        qrMensajeBienvenida: true,
        qrMostrarLogo: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: updatedBusiness.qrBrandingConfig,
    });
  } catch (error) {
    console.error('Error al actualizar configuración QR:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}

// PATCH - Actualización parcial (para cambios específicos)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;
    const partialUpdate = await request.json();

    // Obtener config actual
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        qrBrandingConfig: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    // Merge con config actual
    const currentConfig = (business.qrBrandingConfig as Partial<QRBrandingConfig>) || {};
    const updatedConfig = {
      ...currentConfig,
      ...partialUpdate,
    };

    // Actualizar
    await prisma.business.update({
      where: { id: businessId },
      data: {
        qrBrandingConfig: updatedConfig,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada',
      data: updatedConfig,
    });
  } catch (error) {
    console.error('Error en actualización parcial:', error);
    return NextResponse.json(
      { error: 'Error al actualizar' },
      { status: 500 }
    );
  }
}

// DELETE - Restaurar a valores por defecto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const { businessId } = params;

    await prisma.business.update({
      where: { id: businessId },
      data: {
        qrBrandingConfig: DEFAULT_QR_BRANDING as any,
        qrMensajeBienvenida: DEFAULT_QR_BRANDING.mensaje.texto,
        qrMostrarLogo: DEFAULT_QR_BRANDING.header.mostrarLogo,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración restaurada a valores por defecto',
      data: DEFAULT_QR_BRANDING,
    });
  } catch (error) {
    console.error('Error al restaurar configuración:', error);
    return NextResponse.json(
      { error: 'Error al restaurar configuración' },
      { status: 500 }
    );
  }
}
