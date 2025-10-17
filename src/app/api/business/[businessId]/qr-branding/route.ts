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
      // ✅ Agregar mensaje personalizado de WhatsApp
      if (savedConfig.customWhatsappMessage) {
        response.data.customWhatsappMessage = savedConfig.customWhatsappMessage;
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

    console.log('🔧 PUT qr-branding - businessId:', businessId);
    console.log('📦 Body recibido:', body);

    // Validar que el negocio existe (por ID o slug)
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessId },
          { slug: businessId }
        ]
      },
      select: { 
        id: true,
        qrBrandingConfig: true 
      },
    });

    if (!business) {
      console.error('❌ Negocio no encontrado:', businessId);
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ Negocio encontrado, ID real:', business.id);

    // Extraer campos específicos
    const { mensaje, header, customWhatsappMessage } = body as Partial<QRBrandingConfig & { customWhatsappMessage?: string }>;

    // Obtener configuración actual para preservar datos existentes
    const currentConfig = (business.qrBrandingConfig as any) || {};

    console.log('📄 Config actual:', currentConfig);

    // Preparar datos para actualizar (merge con config existente)
    const updatedConfig = {
      ...currentConfig,
      ...body,
    };

    // ✅ Si viene customWhatsappMessage, actualizar en el JSON
    if (customWhatsappMessage !== undefined) {
      updatedConfig.customWhatsappMessage = customWhatsappMessage;
    }

    console.log('📝 Config actualizada:', updatedConfig);

    const updateData: any = {
      qrBrandingConfig: updatedConfig, // Guardar config completa en JSON
    };

    // Actualizar campos específicos si vienen en el body
    if (mensaje?.texto) {
      updateData.qrMensajeBienvenida = mensaje.texto;
    }

    if (header?.mostrarLogo !== undefined) {
      updateData.qrMostrarLogo = header.mostrarLogo;
    }

    // Actualizar en base de datos usando el ID real
    const updatedBusiness = await prisma.business.update({
      where: { id: business.id }, // ✅ Usar ID real del negocio
      data: updateData,
      select: {
        qrBrandingConfig: true,
        qrMensajeBienvenida: true,
        qrMostrarLogo: true,
        name: true,
      },
    });

    console.log('✅ Actualización exitosa');

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

    // Buscar business por ID o por slug
    const business = await prisma.business.findFirst({
      where: {
        OR: [
          { id: businessId },
          { slug: businessId }
        ]
      },
      select: {
        id: true,
        qrBrandingConfig: true,
        qrMensajeBienvenida: true,
        qrMostrarLogo: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado' },
        { status: 404 }
      );
    }

    // Deep merge con config actual usando DEFAULT como base
    const currentConfig = (business.qrBrandingConfig as Partial<QRBrandingConfig>) || {};
    const updatedConfig: QRBrandingConfig = {
      ...DEFAULT_QR_BRANDING,
      ...currentConfig,
      ...partialUpdate,
      // Deep merge de objetos anidados
      mensaje: {
        ...DEFAULT_QR_BRANDING.mensaje,
        ...(currentConfig.mensaje || {}),
        ...(partialUpdate.mensaje || {}),
      },
      marco: {
        ...DEFAULT_QR_BRANDING.marco,
        ...(currentConfig.marco || {}),
        ...(partialUpdate.marco || {}),
      },
      camposMostrados: {
        ...DEFAULT_QR_BRANDING.camposMostrados,
        ...(currentConfig.camposMostrados || {}),
        ...(partialUpdate.camposMostrados || {}),
      },
      etiquetas: {
        ...DEFAULT_QR_BRANDING.etiquetas,
        ...(currentConfig.etiquetas || {}),
        ...(partialUpdate.etiquetas || {}),
      },
      contacto: {
        ...DEFAULT_QR_BRANDING.contacto,
        ...(currentConfig.contacto || {}),
        ...(partialUpdate.contacto || {}),
      },
      header: {
        ...DEFAULT_QR_BRANDING.header,
        ...(currentConfig.header || {}),
        ...(partialUpdate.header || {}),
      },
      qr: {
        ...DEFAULT_QR_BRANDING.qr,
        ...(currentConfig.qr || {}),
        ...(partialUpdate.qr || {}),
      },
      layout: {
        ...DEFAULT_QR_BRANDING.layout,
        ...(currentConfig.layout || {}),
        ...(partialUpdate.layout || {}),
      },
    };

    // Preparar datos para actualizar
    const updateData: any = {
      qrBrandingConfig: updatedConfig,
    };

    // Actualizar campos específicos si vienen en el body
    if (partialUpdate.mensaje?.texto) {
      updateData.qrMensajeBienvenida = partialUpdate.mensaje.texto;
    }

    if (partialUpdate.header?.mostrarLogo !== undefined) {
      updateData.qrMostrarLogo = partialUpdate.header.mostrarLogo;
    }

    // Actualizar en base de datos
    await prisma.business.update({
      where: { id: business.id },
      data: updateData,
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
